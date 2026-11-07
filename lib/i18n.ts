import I18N from '@/content/i18n.json';

type Lang = 'en' | 'si' | 'ta';
const dict = I18N as Record<string, Partial<Record<Lang, string>>>;

/** Current page language (set by the language switcher on <html lang>). */
export const currentLang = (): Lang => (document.documentElement.lang || 'en') as Lang;

/** Translate an English UI string using the site dictionary; falls back to English. */
export const t = (en: string): string => {
  const l = currentLang();
  return (l !== 'en' && dict[en]?.[l]) || en;
};
