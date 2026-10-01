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
        falcon: {
          50: '#FAF8F5',
          100: '#F3ECE4',
          200: '#E6D5C2',
          300: '#D8BC9C',
          400: '#BF946E',
          500: '#A57750', // Main desert bronze / sand accent
          600: '#8C613F',
          700: '#714D33',
          800: '#563C2A',
          900: '#331F0E',
          950: '#1F1206',
        },
        graphite: {
          50: '#F8F9FA',
          100: '#F1F3F5',
          200: '#E9ECEF',
          300: '#DEE2E6',
          400: '#767D84',
          500: '#687078',
          600: '#495057',
          700: '#343A40',
          800: '#212529',
          900: '#19232C',
          950: '#101214',
        },
        target: {
          a: '#10B981', // A zone
          c: '#F59E0B', // C zone
          d: '#EF4444', // D zone
          cardboard: '#C79A62',
        }
      },
      fontFamily: {
        rubik: ['Rubik', 'Heebo', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
