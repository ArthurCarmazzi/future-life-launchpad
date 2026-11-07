/**
 * Sri Lankan numbers: 0771234567, 077 123 4567, +94771234567, 94771234567 (mobile or landline).
 * Returns the number in +94XXXXXXXXX form, or null if it is not valid.
 */
export const normalizePhone = (raw: string): string | null => {
  const digits = raw.replace(/[\s\-().]/g, '');
  const m = /^(?:\+94|94|0)?([1-9]\d{8})$/.exec(digits);
  return m ? `+94${m[1]}` : null;
};
