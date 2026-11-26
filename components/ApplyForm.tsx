'use client';

import { useEffect } from 'react';
import { t } from '@/lib/i18n';
import { EMAIL_RE, NAME_RE, normalizePitchUrl } from '@/lib/inquiry';
import { normalizePhone } from '@/lib/phone';

/** Public Cloudflare Turnstile site key, inlined at build time. Without it the widget is skipped. */
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

interface TurnstileApi {
  render(
    el: HTMLElement,
    opts: {
      sitekey: string;
      theme?: 'light' | 'dark' | 'auto';
      size?: 'normal' | 'flexible' | 'compact';
      callback?: (token: string) => void;
      'expired-callback'?: () => void;
      'error-callback'?: () => void;
    },
  ): string;
  reset(id?: string): void;
  remove(id?: string): void;
}
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let turnstileScript: Promise<void> | null = null;
const loadTurnstile = (): Promise<void> => {
  if (window.turnstile) return Promise.resolve();
  turnstileScript ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      turnstileScript = null;
      reject(new Error('Turnstile failed to load'));
    };
    document.head.appendChild(s);
  });
  return turnstileScript;
};

/** Server error codes from /api/inquiry mapped to (translated) messages. */
const SERVER_ERRORS: Record<string, string> = {
  rate_limited: 'Too many attempts. Please try again in a few minutes.',
  bot_check: 'The security check failed. Please try again.',
  invalid: 'Some details look wrong. Please check the form and try again.',
};
const DEFAULT_ERROR = "Sorry, we couldn't send your application. Please try again in a moment.";

/** Validation + submission for the inquiry form on /apply. */
export default function ApplyForm() {
  useEffect(() => {
    const form = document.getElementById('applyForm') as HTMLFormElement | null;
    if (!form) return;

    const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
    const name = $<HTMLInputElement>('f-name');
    const phone = $<HTMLInputElement>('f-phone');
    const wa = $<HTMLInputElement>('f-whatsapp');
    const same = $<HTMLInputElement>('f-same');
    const email = $<HTMLInputElement>('f-email');
    const district = $<HTMLSelectElement>('f-district');
    const pitch = $<HTMLInputElement>('f-pitch');
    const groupConsent = $<HTMLInputElement>('f-consent');
    const submit = $<HTMLButtonElement>('applySubmit');
    const status = $<HTMLElement>('applyStatus');
    const thanks = $<HTMLElement>('applyThanks');
    const ageInputs = [...form.querySelectorAll<HTMLInputElement>('input[name="age"]')];
    const honeypot = form.querySelector<HTMLInputElement>('input[name="website"]');

    const focusTargets: Record<string, HTMLElement> = {
      name,
      phone,
      whatsapp: wa,
      email,
      district,
      pitch,
      age: ageInputs[0],
    };

    // Errors are stored by their English key so they can be re-translated on language change
    const keys: Record<string, string> = {};
    const showError = (field: string, key: string | null) => {
      const box = form.querySelector<HTMLElement>(`[data-field="${field}"]`);
      const out = $<HTMLElement>(`e-${field}`);
      if (key) keys[field] = key;
      else delete keys[field];
      out.textContent = key ? t(key) : '';
      box?.classList.toggle('invalid', Boolean(key));
      box?.querySelector('input,select')?.setAttribute('aria-invalid', String(Boolean(key)));
    };

    const check: Record<string, () => string | null> = {
      name: () => (NAME_RE.test(name.value.trim()) ? null : 'Please enter your full name.'),
      phone: () => (normalizePhone(phone.value) ? null : 'Enter a valid Sri Lankan phone number, like 077 123 4567.'),
      whatsapp: () => (normalizePhone(wa.value) ? null : 'Enter a valid WhatsApp number, like 077 123 4567.'),
      email: () => (!email.value.trim() || EMAIL_RE.test(email.value.trim()) ? null : 'Enter a valid email address, like name@example.com.'),
      district: () => (district.value ? null : 'Please choose your district.'),
      pitch: () => (normalizePitchUrl(pitch.value) ? null : 'Enter a link to your pitch on YouTube, Facebook or Instagram.'),
      age: () => (ageInputs.some((i) => i.checked) ? null : 'Please choose your age range.'),
    };
    const fields = Object.keys(check);

    const cleanups: Array<() => void> = [];
    const on = (el: EventTarget, ev: string, fn: EventListener) => {
      el.addEventListener(ev, fn);
      cleanups.push(() => el.removeEventListener(ev, fn));
    };

    // Validate when leaving a field; once an error is showing, re-check as the user types
    const wire = (field: string, els: HTMLElement[]) =>
      els.forEach((el) => {
        on(el, 'blur', () => {
          if ((el as HTMLInputElement).value !== '' || keys[field]) showError(field, check[field]());
        });
        const live = el.tagName === 'SELECT' || (el as HTMLInputElement).type === 'radio' ? 'change' : 'input';
        on(el, live, () => {
          if (keys[field]) showError(field, check[field]());
        });
      });
    wire('name', [name]);
    wire('phone', [phone]);
    wire('whatsapp', [wa]);
    wire('email', [email]);
    wire('district', [district]);
    wire('pitch', [pitch]);
    wire('age', ageInputs);

    // "Same as phone number"
    const syncSame = () => {
      if (same.checked) {
        wa.value = phone.value;
        wa.readOnly = true;
        if (keys.whatsapp) showError('whatsapp', check.whatsapp());
      } else {
        wa.readOnly = false;
      }
    };
    on(same, 'change', syncSame);
    on(phone, 'input', () => {
      if (same.checked) syncSame();
    });

    const setStatus = (key: string | null) => {
      status.dataset.k = key ?? '';
      status.textContent = key ? t(key) : '';
    };

    // Cloudflare Turnstile (bot check). Tokens are single use, so the widget is reset after every attempt.
    let token = '';
    let widgetId: string | undefined;
    let active = true;
    const widgetBox = document.getElementById('ts-widget');
    if (SITE_KEY && widgetBox) {
      loadTurnstile()
        .then(() => {
          if (!active || widgetId || !window.turnstile) return;
          widgetId = window.turnstile.render(widgetBox, {
            sitekey: SITE_KEY,
            theme: 'light',
            size: 'flexible',
            callback: (tk) => (token = tk),
            'expired-callback': () => (token = ''),
            'error-callback': () => (token = ''),
          });
        })
        .catch(() => {});
    }
    cleanups.push(() => {
      active = false;
      if (widgetId) window.turnstile?.remove(widgetId);
      widgetId = undefined;
    });
    const resetCheck = () => {
      token = '';
      if (widgetId) window.turnstile?.reset(widgetId);
    };

    on(window, 'lp-lang', () => {
      Object.entries(keys).forEach(([field, key]) => {
        $<HTMLElement>(`e-${field}`).textContent = t(key);
      });
      if (status.dataset.k) status.textContent = t(status.dataset.k);
    });

    on(form, 'submit', async (e) => {
      e.preventDefault();
      setStatus(null);
      let firstBad: string | null = null;
      fields.forEach((f) => {
        const msg = check[f]();
        showError(f, msg);
        if (msg && !firstBad) firstBad = f;
      });
      if (firstBad) {
        focusTargets[firstBad].focus();
        return;
      }

      // Bots fill hidden fields: pretend success and send nothing
      if (honeypot && honeypot.value) {
        form.hidden = true;
        thanks.hidden = false;
        return;
      }

      if (SITE_KEY && !token) {
        setStatus('Please wait for the security check to finish, then try again.');
        return;
      }

      const label = submit.textContent;
      submit.disabled = true;
      submit.textContent = t('Sending…');
      try {
        const res = await fetch('/api/inquiry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.value.trim(),
            phone: normalizePhone(phone.value),
            whatsapp: normalizePhone(wa.value),
            email: email.value.trim().toLowerCase() || null,
            district: district.value,
            pitchUrl: normalizePitchUrl(pitch.value),
            ageRange: ageInputs.find((i) => i.checked)?.value,
            lang: document.documentElement.lang || 'en',
            groupConsent: groupConsent.checked,
            turnstileToken: token,
          }),
        });
        if (!res.ok) {
          const out = (await res.json().catch(() => ({}))) as { error?: string };
          resetCheck();
          setStatus(SERVER_ERRORS[out.error ?? ''] ?? DEFAULT_ERROR);
          return;
        }
        form.hidden = true;
        thanks.hidden = false;
        thanks.focus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {
        resetCheck();
        setStatus(DEFAULT_ERROR);
      } finally {
        submit.disabled = false;
        submit.textContent = label;
      }
    });

    return () => cleanups.forEach((fn) => fn());
  }, []);

  return null;
}
