/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./views/**/*.ejs"],
    theme: {
      extend: {
        colors: {
          'nexus-red': '#dc2626',
          'nexus-dark': '#1f2937',
        }
      },
    },
    plugins: [],
  }