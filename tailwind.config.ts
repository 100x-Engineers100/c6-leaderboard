import type { Config } from 'tailwindcss'
const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        primary:            'var(--color-primary)',
        secondary:          'var(--color-secondary)',
        surface:            'var(--color-surface)',
        'surface-elevated': 'var(--color-surface-elevated)',
        border:             'var(--color-border)',
        'border-accent':    'var(--color-border-accent)',
        muted:              'var(--color-text-muted)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
      },
    },
  },
  plugins: [],
}
export default config
