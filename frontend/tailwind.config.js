/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        syne: ['Syne', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        bg: {
          light: '#f8fafc',
          dark: '#0a0a0f',
        },
        surface: {
          light: '#ffffff',
          dark: '#111118',
          dark2: '#1a1a25',
        },
        border: {
          light: '#e2e8f0',
          dark: '#2a2a3a',
        },
        accent: {
          DEFAULT: '#7c3aed',
          glow: '#9f67ff',
          cyan: '#06b6d4',
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
