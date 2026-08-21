/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        paper: 'var(--paper)',
        card: 'var(--bg-2)',
        line: 'var(--line)',
        ink: 'var(--ink)',
        dim: 'var(--ink-dim)',
        mute: 'var(--ink-mute)',
        teal: 'var(--teal)',
        gold: 'var(--gold)',
        plum: 'var(--plum)',
        rose: 'var(--rose)',
        ember: 'var(--ember)',
      },
      fontFamily: {
        display: 'var(--serif)',
        sans: 'var(--sans)',
        mono: 'var(--mono)',
      },
      borderRadius: { card: '18px', pill: '999px' },
      boxShadow: {
        soft: '0 1px 2px rgb(0 0 0 / 0.04), 0 8px 24px -12px rgb(0 0 0 / 0.16)',
        lift: '0 2px 6px rgb(0 0 0 / 0.06), 0 18px 40px -20px rgb(0 0 0 / 0.30)',
      },
    },
  },
  plugins: [],
};
