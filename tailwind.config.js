/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'var(--ink)',
        'ink-2': 'var(--ink-2)',
        'ink-soft': 'var(--ink-soft)',
        saffron: 'var(--saffron)',
        cream: 'var(--cream)',
        sage: 'var(--sage)',
        rose: 'var(--rose)',
        muted: 'var(--text-muted)',
        paper: 'var(--paper)',
        'paper-2': 'var(--paper-2)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        line: 'var(--line)',
        'line-strong': 'var(--line-strong)',
        marigold: 'var(--marigold)',
        'marigold-deep': 'var(--marigold-deep)',
        'marigold-wash': 'var(--marigold-wash)',
        leaf: 'var(--leaf)',
        'leaf-deep': 'var(--leaf-deep)',
        'leaf-wash': 'var(--leaf-wash)',
        coral: 'var(--coral)',
        'coral-deep': 'var(--coral-deep)',
        'coral-wash': 'var(--coral-wash)',
        sky: 'var(--sky)',
        'sky-wash': 'var(--sky-wash)',
        'on-ink': 'var(--on-ink)',
        'on-marigold': 'var(--on-marigold)',
      },
      fontFamily: {
        body: ['var(--font-stack-latin)'],
        display: ['var(--font-stack-display)'],
        deva: ['var(--font-stack-devanagari)'],
        mono: ['var(--font-stack-mono)'],
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
