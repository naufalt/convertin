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
        // Material Design 3 Palette
        md: {
          primary: '#6750A4',
          onPrimary: '#FFFFFF',
          primaryContainer: '#EADDFF',
          onPrimaryContainer: '#21005D',
          
          darkPrimary: '#D0BCFF',
          darkOnPrimary: '#381E72',
          darkPrimaryContainer: '#4F378B',
          darkOnPrimaryContainer: '#EADDFF',

          surface: '#FEF7FF',
          onSurface: '#1D1B20',
          surfaceVariant: '#E7E0EC',
          onSurfaceVariant: '#49454F',
          outline: '#79747E',
          outlineVariant: '#CAC4D0',

          darkSurface: '#141218',
          darkOnSurface: '#E6E0E9',
          darkSurfaceVariant: '#49454F',
          darkOnSurfaceVariant: '#CAC4D0',
          darkOutline: '#938F99',
          darkOutlineVariant: '#49454F',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
