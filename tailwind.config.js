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
        body: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
