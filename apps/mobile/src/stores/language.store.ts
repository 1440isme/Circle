import { create } from 'zustand';
import { Locale, dictionaries, TranslationDictionary } from '@circle/shared';

interface LanguageState {
  locale: Locale;
  t: TranslationDictionary;
  setLocale: (locale: Locale) => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  locale: 'vi',
  t: dictionaries['vi'],

  setLocale: (locale: Locale) => {
    set({
      locale,
      t: dictionaries[locale] || dictionaries['vi'],
    });
  },
}));
