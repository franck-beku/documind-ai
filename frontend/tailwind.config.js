/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['DM Sans', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      colors: {
        ink: {
          950: '#080b10',
          900: '#0d1117',
          800: '#131920',
          700: '#1c2530',
          600: '#253040',
          500: '#374355',
          400: '#5a6e85',
          300: '#8a9bb0',
          200: '#b8c5d4',
          100: '#dde5ee',
          50:  '#f0f4f8',
        },
        accent: '#3b82f6',
      },
    },
  },
  plugins: [],
}