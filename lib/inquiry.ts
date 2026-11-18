/** Rules shared by the apply form (browser) and the /api/inquiry function (server). */

export type Lang = 'en' | 'si' | 'ta';
export const LANGS: readonly Lang[] = ['en', 'si', 'ta'];

export const DISTRICTS = [
  'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo', 'Galle', 'Gampaha', 'Hambantota', 'Jaffna',
  'Kalutara', 'Kandy', 'Kegalle', 'Kilinochchi', 'Kurunegala', 'Mannar', 'Matale', 'Matara', 'Monaragala',
  'Mullaitivu', 'Nuwara Eliya', 'Polonnaruwa', 'Puttalam', 'Ratnapura', 'Trincomalee', 'Vavuniya',
] as const;

export const BUSINESS_TYPES = [
  'Technology', 'Retail', 'Manufacturing', 'Handmade / Craft', 'Services', 'Food & Beverage', 'Agriculture', 'Other',
] as const;

export const AGE_RANGES = ['18-24', '25-34', '35-44', '45-54', '55+'] as const;

export const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]{1,79}$/u;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const MAX_EMAIL_LENGTH = 120;
