/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14231F",
        paper: "#F7F6F1",
        seal: "#B7791F",
        teal: "#0F5257",
        line: "#DDD8CB",
      },
      fontFamily: {
        serif: ["'Source Serif 4'", "serif"],
        sans: ["'IBM Plex Sans'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
