import { create } from 'zustand';
import { MessageTheme, MessageBubbleThemes } from '@circle/shared';

export type Theme = 'light' | 'dark' | 'system';
export type { MessageTheme };
export { MessageBubbleThemes };

interface ThemeState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  messageTheme: MessageTheme;
  setTheme: (theme: Theme) => void;
  setMessageTheme: (msgTheme: MessageTheme) => void;
  initTheme: () => void;
}

const THEME_STORAGE_KEY = 'circle_theme';
const MSG_THEME_STORAGE_KEY = 'circle_msg_theme';

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyThemeAttributes(
  resolved: 'light' | 'dark',
  msgTheme: MessageTheme,
) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  // Apply dark mode class and data-theme
  if (resolved === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  root.setAttribute('data-theme', resolved);

  // Apply chat message bubble theme
  root.setAttribute('data-msg-theme', msgTheme);
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'system',
  resolvedTheme: 'light',
  messageTheme: 'sage',

  initTheme: () => {
    if (typeof window === 'undefined') return;
    const storedTheme = (localStorage.getItem(THEME_STORAGE_KEY) as Theme) || 'system';
    const storedMsgTheme = (localStorage.getItem(MSG_THEME_STORAGE_KEY) as MessageTheme) || 'sage';

    const resolved = storedTheme === 'system' ? getSystemTheme() : storedTheme;

    applyThemeAttributes(resolved, storedMsgTheme);
    set({
      theme: storedTheme,
      resolvedTheme: resolved,
      messageTheme: storedMsgTheme,
    });

    // Listen for OS scheme changes when set to system
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (get().theme === 'system') {
        const newResolved = getSystemTheme();
        applyThemeAttributes(newResolved, get().messageTheme);
        set({ resolvedTheme: newResolved });
      }
    };

    mediaQuery.addEventListener('change', handleChange);
  },

  setTheme: (theme: Theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
    const resolved = theme === 'system' ? getSystemTheme() : theme;
    applyThemeAttributes(resolved, get().messageTheme);
    set({ theme, resolvedTheme: resolved });
  },

  setMessageTheme: (messageTheme: MessageTheme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(MSG_THEME_STORAGE_KEY, messageTheme);
    }
    applyThemeAttributes(get().resolvedTheme, messageTheme);
    set({ messageTheme });
  },
}));
