import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        circle: {
          primary: '#78C6A3',
          sage: '#4FA982',
          wash: '#DDF3E8',
          peach: '#F4C7A1',
          charcoal: '#24332C',
          slate: '#718078',
          canvas: '#F7FAF8',
          surface: '#FFFFFF',
          ivory: '#FFF9F4',
          hairline: '#E5ECE8',
          coral: '#E98282',
        },
      },
      fontFamily: {
        sans: ['var(--font-plus-jakarta)', 'Plus Jakarta Sans', 'sans-serif'],
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
