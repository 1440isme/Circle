import { create } from 'zustand';
import { Appearance } from 'react-native';
import { CircleColors, ColorTheme } from '../constants/theme';
import { MessageTheme, MessageBubbleThemes } from '@circle/shared';
import { getItem, setItem } from '../services/storage';

export type AppTheme = 'light' | 'dark' | 'system';
export type { MessageTheme };
export { MessageBubbleThemes };

interface ThemeState {
  theme: AppTheme;
  resolvedTheme: 'light' | 'dark';
  colors: ColorTheme;
  uiStyle?: string;
  messageTheme: MessageTheme;
  setTheme: (theme: AppTheme) => void;
  setMessageTheme: (theme: MessageTheme) => void;
  initTheme: () => Promise<void>;
}

const THEME_KEY = 'circle_mobile_theme';
const MSG_THEME_KEY = 'circle_mobile_msg_theme';

function getSystemTheme(): 'light' | 'dark' {
  return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
}

export const useThemeStore = create<ThemeState>((set) => {
  const system = getSystemTheme();

  return {
    theme: 'system',
    resolvedTheme: system,
    colors: CircleColors[system],
    uiStyle: 'flat',
    messageTheme: 'sage',

    initTheme: async () => {
      try {
        const storedTheme = (await getItem(THEME_KEY)) as AppTheme | null;
        const storedMsgTheme = (await getItem(MSG_THEME_KEY)) as MessageTheme | null;

        const theme = storedTheme || 'system';
        const resolved = theme === 'system' ? getSystemTheme() : theme;
        const messageTheme = storedMsgTheme || 'sage';

        set({
          theme,
          resolvedTheme: resolved,
          colors: CircleColors[resolved],
          messageTheme,
        });
      } catch {}
    },

    setTheme: (theme: AppTheme) => {
      const resolved = theme === 'system' ? getSystemTheme() : theme;
      setItem(THEME_KEY, theme).catch(() => {});
      set({
        theme,
        resolvedTheme: resolved,
        colors: CircleColors[resolved],
      });
    },

    setMessageTheme: (messageTheme: MessageTheme) => {
      setItem(MSG_THEME_KEY, messageTheme).catch(() => {});
      set({ messageTheme });
    },
  };
});

// Auto-hydrate theme & UI style from storage on load
useThemeStore.getState().initTheme().catch(() => {});

// Listen for dynamic system color scheme changes
Appearance.addChangeListener(({ colorScheme }) => {
  const state = useThemeStore.getState();
  if (state.theme === 'system') {
    const resolved = colorScheme === 'dark' ? 'dark' : 'light';
    useThemeStore.setState({
      resolvedTheme: resolved,
      colors: CircleColors[resolved],
    });
  }
});
