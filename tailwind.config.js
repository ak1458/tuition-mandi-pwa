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
        body: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        shell: '0 0 0 10px #1c1b35, 0 0 0 12px #2e2d52, 0 30px 60px rgba(28,27,53,0.35)',
      },
    },
  },
  plugins: [],
}
