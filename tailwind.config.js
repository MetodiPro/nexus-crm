/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./views/**/*.ejs"],
  theme: {
    extend: {
      colors: {
        'nexus-red': '#dc2626',
        'nexus-dark': '#4a5568', // Cambiato da #1f2937 (quasi nero) a #4a5568 (grigio scuro)
      }
    },
  },
  plugins: [],
}