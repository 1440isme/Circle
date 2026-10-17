import { create } from 'zustand';
import { UIStyle, MessageTheme, MessageBubbleThemes } from '@circle/shared';

export type Theme = 'light' | 'dark' | 'system';
export type { UIStyle, MessageTheme };
export { MessageBubbleThemes };

interface ThemeState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  uiStyle: UIStyle;
  messageTheme: MessageTheme;
  setTheme: (theme: Theme) => void;
  setUiStyle: (uiStyle: UIStyle) => void;
  setMessageTheme: (msgTheme: MessageTheme) => void;
  initTheme: () => void;
}

const THEME_STORAGE_KEY = 'circle_theme';
const UI_STYLE_STORAGE_KEY = 'circle_ui_style';
const MSG_THEME_STORAGE_KEY = 'circle_msg_theme';

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyThemeAttributes(
  resolved: 'light' | 'dark',
  uiStyle: UIStyle,
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

  // Apply UI style (flat or glass)
  root.setAttribute('data-ui-style', uiStyle);

  // Apply chat message bubble theme
  root.setAttribute('data-msg-theme', msgTheme);
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'system',
  resolvedTheme: 'light',
  uiStyle: 'flat',
  messageTheme: 'sage',

  initTheme: () => {
    if (typeof window === 'undefined') return;
    const storedTheme = (localStorage.getItem(THEME_STORAGE_KEY) as Theme) || 'system';
    const storedUiStyle = (localStorage.getItem(UI_STYLE_STORAGE_KEY) as UIStyle) || 'flat';
    const storedMsgTheme = (localStorage.getItem(MSG_THEME_STORAGE_KEY) as MessageTheme) || 'sage';

    const resolved = storedTheme === 'system' ? getSystemTheme() : storedTheme;

    applyThemeAttributes(resolved, storedUiStyle, storedMsgTheme);
    set({
      theme: storedTheme,
      resolvedTheme: resolved,
      uiStyle: storedUiStyle,
      messageTheme: storedMsgTheme,
    });

    // Listen for OS scheme changes when set to system
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (get().theme === 'system') {
        const newResolved = getSystemTheme();
        applyThemeAttributes(newResolved, get().uiStyle, get().messageTheme);
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
    applyThemeAttributes(resolved, get().uiStyle, get().messageTheme);
    set({ theme, resolvedTheme: resolved });
  },

  setUiStyle: (uiStyle: UIStyle) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(UI_STYLE_STORAGE_KEY, uiStyle);
    }
    applyThemeAttributes(get().resolvedTheme, uiStyle, get().messageTheme);
    set({ uiStyle });
  },

  setMessageTheme: (messageTheme: MessageTheme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(MSG_THEME_STORAGE_KEY, messageTheme);
    }
    applyThemeAttributes(get().resolvedTheme, get().uiStyle, messageTheme);
    set({ messageTheme });
  },
}));
