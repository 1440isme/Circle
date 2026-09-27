import { create } from 'zustand';
import { Appearance } from 'react-native';
import { CircleColors, ColorTheme } from '../constants/theme';

export type AppTheme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: AppTheme;
  resolvedTheme: 'light' | 'dark';
  colors: ColorTheme;
  setTheme: (theme: AppTheme) => void;
}

function getSystemTheme(): 'light' | 'dark' {
  return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
}

export const useThemeStore = create<ThemeState>((set) => {
  const system = getSystemTheme();

  return {
    theme: 'system',
    resolvedTheme: system,
    colors: CircleColors[system],

    setTheme: (theme: AppTheme) => {
      const resolved = theme === 'system' ? getSystemTheme() : theme;
      set({
        theme,
        resolvedTheme: resolved,
        colors: CircleColors[resolved],
      });
    },
  };
});
