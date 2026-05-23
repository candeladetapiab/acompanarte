/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f5f0fa',
          100: '#e7daf7',
          200: '#cfb5ef',
          300: '#b790e7',
          400: '#9f6bdf',
          500: '#8a55cc',
          600: '#7C5C9E',
          700: '#694e87',
          800: '#564070',
          900: '#432f59',
        },
        secondary: {
          50:  '#fdf5ef',
          100: '#fae8d6',
          200: '#f5d1ad',
          300: '#f0ba84',
          400: '#E8A87C',
          500: '#d99162',
          600: '#ca7a48',
          700: '#a86235',
        },
        accent: {
          50:  '#f8f4fd',
          100: '#f0e8fb',
          200: '#e1d1f7',
          300: '#d2baf3',
          400: '#C9A8E8',
          500: '#b48ed9',
          600: '#9f74ca',
          700: '#8a5abb',
        },
        cream: '#F5F0FA',
        ink:   '#2D1F45',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans:    ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl:    '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
