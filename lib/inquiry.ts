/** Rules shared by the apply form (browser) and the /api/inquiry function (server). */

export type Lang = 'en' | 'si' | 'ta';
export const LANGS: readonly Lang[] = ['en', 'si', 'ta'];

export const DISTRICTS = [
  'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo', 'Galle', 'Gampaha', 'Hambantota', 'Jaffna',
  'Kalutara', 'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar', 'Matale', 'Matara', 'Monaragala',
  'Mullaitivu', 'Nuwara Eliya', 'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya',
] as const;

export const AGE_RANGES = ['18-24', '25-34', '35-44', '45-54', '55+'] as const;

export const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]{1,79}$/u;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const MAX_EMAIL_LENGTH = 120;

// ---- Pitch link: a video or post on YouTube, Facebook or Instagram
const PITCH_HOSTS = ['youtube.com', 'youtu.be', 'facebook.com', 'fb.watch', 'fb.com', 'instagram.com', 'instagr.am'];
export const MAX_PITCH_URL_LENGTH = 300;

/**
 * Returns a clean https/http link to YouTube, Facebook or Instagram, or null.
 * A missing "https://" is added; other websites, other schemes (javascript:, data:) and links that carry a
 * username or password are rejected. Used by the form and, again, by the server.
 */
export function normalizePitchUrl(raw: string): string | null {
  let s = raw.trim();
  if (!s || s.length > MAX_PITCH_URL_LENGTH || /\s/.test(s)) return null;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = 'https://' + s;
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    return null;
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
  if (u.username || u.password) return null;
  const host = u.hostname.toLowerCase();
  const ok = PITCH_HOSTS.some((h) => host === h || host.endsWith('.' + h));
  return ok ? u.toString() : null;
}
