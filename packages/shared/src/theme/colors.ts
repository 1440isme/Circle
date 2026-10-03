export interface ColorTokens {
  primary: string;
  primaryDark: string;
  sage: string;
  wash: string;
  canvas: string;
  surface: string;
  elevated: string;
  text: string;
  charcoal: string;
  subtle: string;
  slate: string;
  hairline: string;
  border: string;
  peach: string;
  coral: string;
  onPrimary: string;
  success: string;
  warning: string;
  info: string;
  accent: string;
  danger: string;
  glass: string;
  glassBorder: string;
  sheetBg: string;
}

export const CircleColors: { light: ColorTokens; dark: ColorTokens } = {
  light: {
    primary: '#658C77', // Herbal Sage (Canonical Light Primary)
    primaryDark: '#4A6B5D',
    sage: '#4A6B5D',
    wash: '#EBF1ED', // Canonical Light Wash
    canvas: '#FAF8F5', // Warm Ivory Canonical Canvas
    surface: '#FFFFFF',
    elevated: '#FFFFFF',
    text: '#1F2923', // Charcoal Text
    charcoal: '#1F2923',
    subtle: '#6B7C72', // Slate Subtle
    slate: '#6B7C72',
    hairline: '#E5E9E7',
    border: '#E5E9E7',
    peach: '#E89D71',
    coral: '#E05A47',
    onPrimary: '#FFFFFF',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6',
    accent: '#8B5CF6',
    danger: '#EF4444',
    glass: 'rgba(255, 255, 255, 0.75)',
    glassBorder: 'rgba(255, 255, 255, 0.85)',
    sheetBg: 'rgba(255, 255, 255, 0.95)',
  },
  dark: {
    primary: '#78C6A3', // Mint Sage (Canonical Dark Primary)
    primaryDark: '#4FA982',
    sage: '#4FA982',
    wash: 'rgba(120, 198, 163, 0.15)',
    canvas: '#0E1512', // Deep Obsidian Dark Canvas
    surface: '#16201B', // Dark Surface
    elevated: '#1E2C25', // Elevated Dark Surface
    text: '#E8EFEA', // Soft White Text
    charcoal: '#0E1512',
    subtle: '#8FA298', // Muted Sage Text
    slate: '#8FA298',
    hairline: '#24352C',
    border: '#24352C',
    peach: '#F4C7A1',
    coral: '#E98282',
    onPrimary: '#0E1512',
    success: '#34D399',
    warning: '#FBBF24',
    info: '#60A5FA',
    accent: '#A78BFA',
    danger: '#F87171',
    glass: 'rgba(14, 21, 18, 0.78)',
    glassBorder: 'rgba(255, 255, 255, 0.12)',
    sheetBg: 'rgba(22, 32, 27, 0.95)',
  },
};

export type ColorTheme = ColorTokens;
