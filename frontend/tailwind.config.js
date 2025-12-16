/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0f0f11', // Background utama gelap
          800: '#18181b', // Background card
        }
      }
    },
  },
  plugins: [],
}