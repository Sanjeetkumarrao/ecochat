/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#00a884",
        primary2: "#005c4b",
        dark: {
          bg: "#111b21",
          surface: "#1f2c34",
          card: "#202c33",
          panel: "#2a3942",
          border: "#3b4a54",
          text: "#e9edef",
          muted: "#8696a0",
          bubble: "#005c4b",
          bubbleIn: "#202c33",
        },
      },
    },
  },
  plugins: [],
};
