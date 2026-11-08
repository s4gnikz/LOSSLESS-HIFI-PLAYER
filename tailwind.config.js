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
          950: '#06070a',
          900: '#0a0d14',
          850: '#0f131c',
          800: '#141a27',
          700: '#1e2638',
          600: '#2b364e',
          500: '#435478',
        },
        gold: {
          400: '#f6d365',
          500: '#fda085',
          atmos: '#d4af37',
          glow: '#ffdf78'
        },
        spatial: {
          cyan: '#00f2fe',
          blue: '#4facfe',
          purple: '#a855f7',
          emerald: '#10b981',
          coral: '#ff5858'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-atmos': '0 0 25px rgba(212, 175, 55, 0.35)',
        'glow-cyan': '0 0 25px rgba(0, 242, 254, 0.35)',
        'glow-purple': '0 0 25px rgba(168, 85, 247, 0.35)',
        'inner-dark': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.6)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 20s linear infinite',
        'sound-wave': 'soundwave 1.2s ease-in-out infinite',
      },
      keyframes: {
        soundwave: {
          '0%, 100%': { height: '20%' },
          '50%': { height: '100%' },
        }
      }
    },
  },
  plugins: [],
}
