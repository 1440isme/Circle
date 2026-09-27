import { vi, TranslationDictionary } from './vi';
import { en } from './en';

export type Locale = 'vi' | 'en';

export const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

export const dictionaries: Record<Locale, TranslationDictionary> = {
  vi,
  en,
};

export const locales = dictionaries;

export function resolveLocale(circleLocale?: string | null, acceptLanguage?: string | null): Locale {
  if (circleLocale === 'en' || circleLocale === 'vi') return circleLocale;
  if (acceptLanguage && acceptLanguage.toLowerCase().startsWith('en')) return 'en';
  return 'vi';
}

export { vi, en };
export type { TranslationDictionary };

