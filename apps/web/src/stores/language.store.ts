'use client';

import { create } from 'zustand';
import { Locale, dictionaries, TranslationDictionary } from '@circle/shared';
import { getCookie, setCookie } from '../lib/cookies';

const LOCALE_STORAGE_KEY = 'circle_locale';

interface LanguageState {
  locale: Locale;
  t: TranslationDictionary;
  setLocale: (locale: Locale) => void;
  initLanguage: () => void;
}

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'vi';
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY) || getCookie(LOCALE_STORAGE_KEY);
  if (stored === 'en' || stored === 'vi') return stored;
  return 'vi'; // Default to Vietnamese
}

export const useLanguageStore = create<LanguageState>((set) => {
  return {
    locale: 'vi',
    t: dictionaries['vi'],

    initLanguage: () => {
      const current = getInitialLocale();
      set({
        locale: current,
        t: dictionaries[current],
      });
    },

    setLocale: (locale: Locale) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCALE_STORAGE_KEY, locale);
        setCookie(LOCALE_STORAGE_KEY, locale, 365); // 1 year
      }
      set({
        locale,
        t: dictionaries[locale],
      });
    },
  };
});
