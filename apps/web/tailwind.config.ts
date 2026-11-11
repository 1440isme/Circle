import type { Config } from 'tailwindcss';

// NOTE: Mirrored from packages/shared/src/theme/colors.ts (CircleColors).
// Update both whenever theme tokens change.
const circleColors = {
  light: {
    primary: '#10B981', // Emerald green
    sage: '#059669',
    wash: 'rgba(16, 185, 129, 0.08)',
    peach: '#E89D71',
    charcoal: '#17171A', // Neutral dark text
    slate: '#6E6E76', // Neutral gray
    canvas: '#FFFFFF', // Neutral clean white canvas
    surface: '#F5F5F6', // Neutral surface
    ivory: '#FFFFFF',
    hairline: '#E3E3E8', // Neutral 1px border
    coral: '#DC2626',
  },
  dark: {
    canvas: '#131316', // Deep neutral obsidian
    surface: '#1D1D21', // Neutral dark surface
    elevated: '#2A2A30', // Neutral dark elevated
    warm: '#1D1D21',
    hairline: '#2E2E35', // Neutral dark border
    text: '#F2F2F4', // Crisp clean white
    muted: '#A1A1AA', // Neutral gray
    wash: 'rgba(52, 211, 153, 0.12)',
    primary: '#34D399', // Mint green
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
          'primary-hover': '#059669',
          primaryHover: '#059669',
          primaryDark: '#059669',
          success: '#10B981',
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
            bg: '#131316',
            border: '#2E2E35',
            hover: '#2A2A30',
            card: '#1D1D21',
          },
        },
      },
      spacing: {
        '0.2': '0.05rem',
        '7.5': '1.875rem',
        '13': '3.25rem',
        '18': '4.5rem',
        '76': '19rem',
      },
      opacity: {
        '12': '0.12',
        '88': '0.88',
        '92': '0.92',
        '94': '0.94',
        '96': '0.96',
        '98': '0.98',
      },
      zIndex: {
        '60': '60',
      },
      scale: {
        '98': '0.98',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1.5rem',
        '3xl': '2.0rem',
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        xs: '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'circle-card': '0 2px 8px -2px rgba(36, 51, 44, 0.04)',
        'circle-hover': '0 10px 25px -4px rgba(36, 51, 44, 0.08), 0 4px 10px -2px rgba(36, 51, 44, 0.03)',
        'circle-modal': '0 20px 48px -8px rgba(36, 51, 44, 0.14)',
      },
      keyframes: {
        'presence-breathe': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(120, 198, 163, 0.4)' },
          '50%': { boxShadow: '0 0 0 6px rgba(120, 198, 163, 0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleUp: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'presence-breathe': 'presence-breathe 3.2s infinite ease-in-out',
        fadeIn: 'fadeIn 0.16s ease-out',
        'fade-in': 'fadeIn 0.16s ease-out',
        scaleUp: 'scaleUp 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-up': 'scaleUp 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
