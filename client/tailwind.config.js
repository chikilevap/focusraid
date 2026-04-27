/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          500: "#7c3aed",
          600: "#6d28d9"
        }
      }
    }
  },
  plugins: []
};
