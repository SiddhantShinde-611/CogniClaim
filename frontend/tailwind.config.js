/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6C3FC5',
          50: '#F0EBFC',
          100: '#E1D7F9',
          200: '#C3AFF3',
          300: '#A587ED',
          400: '#875FE7',
          500: '#6C3FC5',
          600: '#5630A0',
          700: '#40237A',
          800: '#2B1654',
          900: '#150A2D',
        },
        accent: {
          DEFAULT: '#D4A017',
          50: '#FDF8E7',
          100: '#FBF1CF',
          200: '#F7E39F',
          300: '#F3D56F',
          400: '#EFC73F',
          500: '#D4A017',
          600: '#AA8012',
          700: '#7F600D',
          800: '#554009',
          900: '#2A2004',
        },
        success: '#1E8449',
        danger: '#C0392B',
        surface: '#F4F6FB',
        'text-primary': '#1A1A2E',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
};
