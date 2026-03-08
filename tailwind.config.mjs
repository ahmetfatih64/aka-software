import { createRequire } from 'module';
const require = createRequire(import.meta.url);

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      maxWidth: {
        content: '65ch',
      },
      borderRadius: {
        xl:  '0.75rem',
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      colors: {
        /* Design-token aliases — use with Tailwind utilities */
        accent: {
          DEFAULT: 'rgb(var(--color-accent))',
          dim:     'rgb(var(--color-accent-dim))',
          bright:  'rgb(var(--color-accent-bright))',
          fg:      'rgb(var(--color-accent-fg))',
          muted:   'rgb(var(--color-accent) / 0.12)',
        },
        /* Raw palette — use when you need a specific tone */
        gold: {
          dark:    '#A17418',
          main:    '#D9A128',
          bright:  '#F5D65C',
        },
        obsidian: {
          DEFAULT: '#110E0D',
          surface: '#181411',
          card:    '#1E1915',
        },
      },
      boxShadow: {
        sm:         '0 1px 3px rgba(0,0,0,0.06)',
        md:         '0 8px 30px rgba(0,0,0,0.10)',
        lg:         '0 20px 50px rgba(0,0,0,0.14)',
        'gold-sm':  '0 0 10px rgba(217,161,40,0.22), 0 2px 6px rgba(0,0,0,0.30)',
        'gold-md':  '0 0 22px rgba(217,161,40,0.28), 0 6px 24px rgba(0,0,0,0.38)',
        'gold-lg':  '0 0 44px rgba(217,161,40,0.32), 0 12px 44px rgba(0,0,0,0.48)',
      },
      keyframes: {
        'fade-in-up': {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.7' },
          '50%':      { opacity: '1'   },
        },
        'accordion-open': {
          from: { height: '0', opacity: '0' },
          to:   { height: 'var(--accordion-height, auto)', opacity: '1' },
        },
        'accordion-close': {
          from: { height: 'var(--accordion-height, auto)', opacity: '1' },
          to:   { height: '0', opacity: '0' },
        },
      },
      animation: {
        'fade-in-up':      'fade-in-up 240ms ease-out both',
        'glow-pulse':      'glow-pulse 2.4s ease-in-out infinite',
        'accordion-open':  'accordion-open 200ms ease-out',
        'accordion-close': 'accordion-close 200ms ease-out',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
