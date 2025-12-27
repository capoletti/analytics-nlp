/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#28a745',
          dark: '#218838',
          light: '#34ce57',
        },
        secondary: {
          DEFAULT: '#6c757d',
          dark: '#545b62',
          light: '#858e96',
        },
        danger: {
          DEFAULT: '#dc3545',
          dark: '#c82333',
          light: '#e4606d',
        },
        info: {
          DEFAULT: '#17a2b8',
          dark: '#138496',
          light: '#3ab4c6',
        },
        warning: {
          DEFAULT: '#ffc107',
          dark: '#e0a800',
          light: '#ffcd39',
        },
      },
    },
  },
  plugins: [],
};
