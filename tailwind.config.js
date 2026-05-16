/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'var(--ink)',
        saffron: 'var(--saffron)',
        cream: 'var(--cream)',
        sage: 'var(--sage)',
        rose: 'var(--rose)',
        muted: 'var(--text-muted)',
      },
      fontFamily: {
        body: ['var(--font-stack-latin)'],
        deva: ['var(--font-stack-devanagari)'],
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 200ms ease-out both',
      },
    },
  },
  plugins: [],
}
