/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // add new color #23262E
      colors: {
        dark: '#23262E',
      },
    },
  },
  plugins: [],
}