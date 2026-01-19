/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'supreme': {
          'black': '#0a0a0a',
          'dark': '#121212',
          'gray': '#1a1a1a',
          'light-gray': '#2a2a2a',
          'gold': '#d4af37',
          'gold-light': '#f4cf57',
          'gold-dark': '#b4952f',
        }
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
