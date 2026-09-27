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

export { vi, en };
export type { TranslationDictionary };
