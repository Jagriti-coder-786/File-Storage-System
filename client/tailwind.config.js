/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        vault: {
          yellow: '#F5C542',
          yellowHover: '#DFAF24',
          yellowLight: '#FEF8E7',
          yellowDark: '#B88E14',
          bg: '#FAFAF8',
          surface: '#FFFFFF',
          border: '#E8E6DF',
          textPrimary: '#171717',
          textSecondary: '#666666',
          darkBg: '#111111',
          darkSurface: '#1A1A1A',
          darkSurfaceElevated: '#242424',
          darkBorder: '#282828',
          darkText: '#F5F5F5',
          darkMuted: '#999999',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
        elevated: '0 10px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
        glow: '0 0 20px -3px rgba(245, 197, 66, 0.35)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
