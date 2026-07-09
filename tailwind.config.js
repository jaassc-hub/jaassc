/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        azul: {
          DEFAULT: "#0F40BC",
          dark: "#0B2D84",
          light: "#4B70CD",
        },
        naranja: {
          DEFAULT: "#F2790B",
          dark: "#C95F00",
          light: "#FF9B3D",
        },
      },
    },
  },
  plugins: [],
};
