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
          100: '#F4EFE6',
          200: '#E8DCB8',
          300: '#D9C496',
          400: '#C29B5A',
          500: '#A67C37', // Main desert bronze / sand accent
          600: '#8C6228',
          700: '#6E491C',
          800: '#4D3115',
          900: '#331F0E',
          950: '#1F1206',
        },
        graphite: {
          50: '#F8F9FA',
          100: '#F1F3F5',
          200: '#E9ECEF',
          300: '#DEE2E6',
          400: '#CED4DA',
          500: '#868E96',
          600: '#495057',
          700: '#343A40',
          800: '#212529',
          900: '#181B1E',
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
