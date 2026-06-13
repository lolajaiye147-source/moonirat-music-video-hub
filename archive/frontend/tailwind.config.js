/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './context/**/*.{js,ts,jsx,tsx}',
    './hooks/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        moon: {
          50:  '#f0f0ff',
          100: '#e4e3ff',
          200: '#cccbfe',
          300: '#a9a6fd',
          400: '#8178fa',
          500: '#6251f5',
          600: '#5030eb',
          700: '#431ed0',
          800: '#381aaa',
          900: '#301887',
          950: '#1d0e5c',
        },
        dark: {
          900: '#0a0a0f',
          800: '#111118',
          700: '#1a1a24',
          600: '#22222f',
          500: '#2e2e3f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
