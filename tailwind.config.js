/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        audiophile: {
          950: 'var(--color-bg-base, #0c0a09)',
          900: 'var(--color-bg-card, #141210)',
          850: 'var(--color-bg-elevated, #1c1917)',
          800: 'var(--color-border-subtle, #292524)',
          700: 'var(--color-border-accent, #44403c)',
          600: 'var(--color-text-muted, #57534e)',
          500: 'var(--color-text-secondary, #78716c)',
          400: '#a8a29e',
          300: '#d6d3d1',
          200: '#e7e5e4',
          100: '#f5f5f4',
        },
        gold: {
          400: '#fde047',
          500: '#e5b869',
          atmos: '#d4af37',
          glow: '#fde68a',
          warm: '#eab308'
        },
        warm: {
          amber: '#f59e0b',
          honey: '#fbbf24',
          espresso: '#171412',
          charcoal: '#12100e',
          sepia: '#78350f',
          cream: '#fef3c7'
        },
        spatial: {
          cyan: '#38bdf8',
          blue: '#60a5fa',
          purple: '#c084fc',
          emerald: '#34d399',
          coral: '#f87171'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'SF Mono', 'monospace'],
      },
      boxShadow: {
        'glow-atmos': '0 0 25px rgba(212, 175, 55, 0.35)',
        'glow-cyan': '0 0 25px rgba(56, 189, 248, 0.35)',
        'glow-purple': '0 0 25px rgba(192, 132, 252, 0.35)',
        'inner-dark': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.6)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 20s linear infinite',
        'sound-wave': 'soundwave 1.2s ease-in-out infinite',
      },
      keyframes: {
        soundwave: {
          '0%, 100%': { transform: 'scaleY(0.25)', transformOrigin: 'bottom' },
          '50%': { transform: 'scaleY(1.0)', transformOrigin: 'bottom' },
        }
      }
    },
  },
  plugins: [],
}
