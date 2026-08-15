/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        blush: {
          50: "#faf6f7",
          100: "#f5eef1",
          200: "#ecdde3",
          300: "#e0c4cf",
          400: "#d19aab",
          500: "#c45c7a",
          600: "#a84866",
          700: "#8a3a54",
          800: "#6f3145",
          900: "#5a2a3a",
        },
        ink: {
          DEFAULT: "#2a1f24",
          muted: "#7a6670",
          soft: "#a8929c",
        },
      },
      fontFamily: {
        display: ['"Fraunces"', "Georgia", "serif"],
        sans: ['"Outfit"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 16px rgba(90, 42, 58, 0.08)",
        lift: "0 8px 28px rgba(90, 42, 58, 0.12)",
      },
      borderRadius: {
        sheet: "20px",
      },
    },
  },
  plugins: [],
};
