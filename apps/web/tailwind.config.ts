import type { Config } from 'tailwindcss';

// NOTE: Mirrored from packages/shared/src/theme/colors.ts (CircleColors).
// Update both whenever theme tokens change.
const circleColors = {
  light: {
    primary: '#658C77',
    sage: '#4A6B5D',
    wash: '#EBF1ED',
    peach: '#E89D71',
    charcoal: '#1F2923',
    slate: '#6B7C72',
    canvas: '#FAF8F5',
    surface: '#FFFFFF',
    ivory: '#FAF8F5',
    hairline: '#E5E9E7',
    coral: '#E05A47',
  },
  dark: {
    canvas: '#0E1512',
    surface: '#16201B',
    elevated: '#1E2C25',
    warm: '#241E18',
    hairline: '#24352C',
    text: '#E8EFEA',
    muted: '#8FA298',
    wash: 'rgba(120, 198, 163, 0.15)',
    primary: '#78C6A3',
  },
};

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        circle: {
          primary: circleColors.light.primary,
          sage: circleColors.light.sage,
          wash: circleColors.light.wash,
          peach: circleColors.light.peach,
          charcoal: circleColors.light.charcoal,
          slate: circleColors.light.slate,
          canvas: circleColors.light.canvas,
          surface: circleColors.light.surface,
          ivory: circleColors.light.canvas,
          hairline: circleColors.light.hairline,
          coral: circleColors.light.coral,
          dark: {
            canvas: circleColors.dark.canvas,
            surface: circleColors.dark.surface,
            elevated: circleColors.dark.elevated,
            warm: circleColors.dark.warm,
            hairline: circleColors.dark.hairline,
            text: circleColors.dark.text,
            muted: circleColors.dark.muted,
            wash: circleColors.dark.wash,
            primary: circleColors.dark.primary,
          },
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1.5rem',
        '3xl': '2.0rem',
      },
      boxShadow: {
        'circle-card': '0 2px 8px -2px rgba(36, 51, 44, 0.04)',
        'circle-hover': '0 10px 25px -4px rgba(36, 51, 44, 0.08), 0 4px 10px -2px rgba(36, 51, 44, 0.03)',
        'circle-modal': '0 20px 48px -8px rgba(36, 51, 44, 0.14)',
      },
      keyframes: {
        'presence-breathe': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(120, 198, 163, 0.4)' },
          '50%': { boxShadow: '0 0 0 6px rgba(120, 198, 163, 0)' },
        },
      },
      animation: {
        'presence-breathe': 'presence-breathe 3.2s infinite ease-in-out',
      },
    },
  },
  plugins: [],
};

export default config;
