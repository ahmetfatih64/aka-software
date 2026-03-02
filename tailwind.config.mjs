/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      maxWidth: {
        content: '65ch',
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0,0,0,0.04)',
        md: '0 8px 30px rgba(0,0,0,0.06)',
        lg: '0 20px 50px rgba(0,0,0,0.10)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'accordion-open': {
          from: { height: '0', opacity: '0' },
          to: { height: 'var(--accordion-height, auto)', opacity: '1' },
        },
        'accordion-close': {
          from: { height: 'var(--accordion-height, auto)', opacity: '1' },
          to: { height: '0', opacity: '0' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 200ms ease-out both',
        'accordion-open': 'accordion-open 200ms ease-out',
        'accordion-close': 'accordion-close 200ms ease-out',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
