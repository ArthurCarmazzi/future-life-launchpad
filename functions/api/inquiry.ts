import { AGE_RANGES, DISTRICTS, EMAIL_RE, LANGS, MAX_EMAIL_LENGTH, NAME_RE, normalizePitchUrl, type Lang } from '../../lib/inquiry';
import { normalizePhone } from '../../lib/phone';
import { autoReply, staffEmail, type Application, type Mail } from '../_lib/emails';

/**
 * POST /api/inquiry  (Cloudflare Pages Function)
 *
 *  1. validates the application and checks the visitor is human (Turnstile)
 *  2. emails the application to the Launchpad mailbox (always)
 *  3. emails an automatic reply to the applicant (only if they gave an email)
 *
 * Settings: RESEND_API_KEY and TURNSTILE_SECRET_KEY are secrets; TO_EMAIL and FROM_EMAIL are plain variables.
 * RESEND_API_URL and TURNSTILE_VERIFY_URL exist only so tests can point at a stand-in.
 */

interface Env {
  RESEND_API_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  TO_EMAIL?: string;
  FROM_EMAIL?: string;
  RESEND_API_URL?: string;
  TURNSTILE_VERIFY_URL?: string;
}

interface Ctx {
  request: Request;
  env: Env;
  waitUntil(promise: Promise<unknown>): void;
}

const MAX_BODY_BYTES = 10_000;
const RATE_LIMIT = 5; // submissions ...
const RATE_WINDOW_SECONDS = 600; // ... per 10 minutes, per visitor and data centre

const json = (body: Record<string, unknown>, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

const asString = (v: unknown): string => (typeof v === 'string' ? v : '');

/** Returns the cleaned application, or the names of the fields that failed. */
function validate(body: Record<string, unknown>): { ok: true; data: Application } | { ok: false; fields: string[] } {
  const bad: string[] = [];

  const name = asString(body.name).trim();
  if (!NAME_RE.test(name)) bad.push('name');

  const phone = normalizePhone(asString(body.phone));
  if (!phone) bad.push('phone');

  const whatsapp = normalizePhone(asString(body.whatsapp));
  if (!whatsapp) bad.push('whatsapp');

  let email: string | null = null;
  const rawEmail = asString(body.email).trim().toLowerCase();
  if (rawEmail) {
    if (rawEmail.length > MAX_EMAIL_LENGTH || !EMAIL_RE.test(rawEmail)) bad.push('email');
    else email = rawEmail;
  }

  const district = asString(body.district);
  if (!(DISTRICTS as readonly string[]).includes(district)) bad.push('district');

  const pitchUrl = normalizePitchUrl(asString(body.pitchUrl));
  if (!pitchUrl) bad.push('pitchUrl');

  const ageRange = asString(body.ageRange);
  if (!(AGE_RANGES as readonly string[]).includes(ageRange)) bad.push('ageRange');

  const lang = (LANGS as readonly string[]).includes(asString(body.lang)) ? (asString(body.lang) as Lang) : 'en';

  if (bad.length || !phone || !whatsapp || !pitchUrl) return { ok: false, fields: bad };
  return {
    ok: true,
    data: { name, phone, whatsapp, email, district, pitchUrl, ageRange, lang, groupConsent: body.groupConsent === true },
  };
}

/** Best-effort throttle using the Cloudflare cache. Fails open: if the cache is unavailable, nobody is blocked. */
async function isRateLimited(ip: string | null): Promise<boolean> {
  if (!ip) return false;
  try {
    const cache = (caches as unknown as { default: Cache }).default;
    const key = new Request(`https://ratelimit.internal/inquiry/${encodeURIComponent(ip)}`);
    const hit = await cache.match(key);
    const count = hit ? Number(await hit.text()) || 0 : 0;
    if (count >= RATE_LIMIT) return true;
    await cache.put(
      key,
      new Response(String(count + 1), { headers: { 'Cache-Control': `max-age=${RATE_WINDOW_SECONDS}` } }),
    );
    return false;
  } catch {
    return false;
  }
}

async function passesTurnstile(env: Env, token: string, ip: string | null): Promise<boolean> {
  if (!token || token.length > 2048) return false;
  const form = new FormData();
  form.append('secret', env.TURNSTILE_SECRET_KEY as string);
  form.append('response', token);
  if (ip) form.append('remoteip', ip);
  try {
    const res = await fetch(env.TURNSTILE_VERIFY_URL ?? 'https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
    });
    const out = (await res.json()) as { success?: boolean };
    return res.ok && out.success === true;
  } catch {
    return false;
  }
}

type SendResult = { accepted: boolean; messageId?: string };

async function send(env: Env, mail: Mail, kind: 'staff' | 'applicant'): Promise<SendResult> {
  // Reuse the key for retries of the same message to avoid duplicate emails.
  const key = crypto.randomUUID();
  for (let attempt = 1; attempt <= 3; attempt++) {
    let delay = attempt * 1000;
    try {
      const res = await fetch(`${env.RESEND_API_URL ?? 'https://api.resend.com'}/emails`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': key,
        },
        body: JSON.stringify(mail),
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const data = (await res.json().catch(() => ({}))) as { id?: string };
        console.info('Resend accepted email', { kind, messageId: data.id, attempt });
        return { accepted: true, messageId: data.id };
      }
      const error = (await res.json().catch(() => ({}))) as { name?: string };
      // Avoid logging recipient addresses, message contents or API credentials.
      console.error('Resend rejected email', { kind, status: res.status, code: error.name, attempt });
      if (res.status !== 429 && res.status < 500) return { accepted: false };
      if (res.status === 429 && error.name !== 'rate_limit_exceeded') return { accepted: false };
      const retryAfter = res.headers.get('Retry-After');
      if (retryAfter) {
        const seconds = Number(retryAfter);
        const ms = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(retryAfter) - Date.now();
        if (Number.isFinite(ms)) {
          if (ms > 5000) return { accepted: false };
          delay = Math.max(delay, ms);
        }
      }
    } catch {
      console.error('Resend request failed', { kind, attempt });
    }
    if (attempt < 3) await new Promise<void>((resolve) => setTimeout(resolve, delay));
  }
  return { accepted: false };
}

export async function onRequestPost({ request, env }: Ctx): Promise<Response> {
  if (!(request.headers.get('Content-Type') ?? '').includes('application/json')) {
    return json({ ok: false, error: 'invalid' }, 415);
  }
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return json({ ok: false, error: 'invalid' }, 413);

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) throw new Error('not an object');
    body = parsed as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: 'invalid' }, 400);
  }

  // Bots fill the hidden field; pretend it worked and send nothing
  if (asString(body.website)) return json({ ok: true });

  if (!env.RESEND_API_KEY || !env.TURNSTILE_SECRET_KEY || !env.TO_EMAIL || !env.FROM_EMAIL) {
    console.error('Inquiry route is missing settings (RESEND_API_KEY, TURNSTILE_SECRET_KEY, TO_EMAIL, FROM_EMAIL)');
    return json({ ok: false, error: 'server' }, 500);
  }

  const checked = validate(body);
  if (!checked.ok) return json({ ok: false, error: 'invalid', fields: checked.fields }, 400);

  const ip = request.headers.get('CF-Connecting-IP');
  if (await isRateLimited(ip)) return json({ ok: false, error: 'rate_limited' }, 429);

  if (!(await passesTurnstile(env, asString(body.turnstileToken), ip))) {
    return json({ ok: false, error: 'bot_check' }, 403);
  }

  // The team email is the one that matters: if it fails, the visitor sees an error and can retry
  if (!(await send(env, staffEmail(checked.data, env.FROM_EMAIL, env.TO_EMAIL), 'staff')).accepted) {
    return json({ ok: false, error: 'email' }, 502);
  }

  // Observe the confirmation outcome without asking the visitor to resubmit a successful application.
  const reply = autoReply(checked.data, env.FROM_EMAIL, env.TO_EMAIL);
  const autoReplyStatus = reply
    ? (await send(env, reply, 'applicant')).accepted ? 'accepted' : 'failed'
    : 'skipped';

  return json({ ok: true, autoReplyStatus });
}

/** Every other method is rejected. */
export function onRequest(): Response {
  return new Response(JSON.stringify({ ok: false, error: 'method' }), {
    status: 405,
    headers: { Allow: 'POST', 'Content-Type': 'application/json; charset=utf-8' },
  });
}
