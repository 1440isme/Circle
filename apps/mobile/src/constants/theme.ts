export const CircleColors = {
  light: {
    primary: '#658C77', // Herbal Sage
    primaryDark: '#4A6B5D',
    wash: '#EBF1ED',
    canvas: '#FAF8F5', // Warm Ivory
    surface: '#FFFFFF',
    elevated: '#FFFFFF',
    text: '#1F2923', // Charcoal
    subtle: '#6B7C72', // Slate
    hairline: 'rgba(0, 0, 0, 0.08)',
    peach: '#E89D71',
    coral: '#E05A47',
    border: '#E5E9E7',
    onPrimary: '#FFFFFF',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6',
    accent: '#8B5CF6',
    glass: 'rgba(255, 255, 255, 0.75)',
    glassBorder: 'rgba(255, 255, 255, 0.85)',
    sheetBg: 'rgba(255, 255, 255, 0.95)',
  },
  dark: {
    primary: '#7BA88F',
    primaryDark: '#5E8570',
    wash: '#1E2822',
    canvas: '#121614',
    surface: '#1A201C',
    elevated: '#242D27',
    text: '#F2F5F3',
    subtle: '#8FA095',
    hairline: 'rgba(255, 255, 255, 0.1)',
    peach: '#F0B28D',
    coral: '#E87060',
    border: '#2C3831',
    onPrimary: '#121614',
    success: '#34D399',
    warning: '#FBBF24',
    info: '#60A5FA',
    accent: '#A78BFA',
    glass: 'rgba(20, 24, 22, 0.72)',
    glassBorder: 'rgba(255, 255, 255, 0.16)',
    sheetBg: 'rgba(26, 32, 29, 0.94)',
  },
};

export type ColorTheme = typeof CircleColors.light;
