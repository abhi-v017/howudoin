/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        "surface-alt": "var(--color-surface-alt)",
        primary: "var(--color-primary)",
        "primary-alt": "var(--color-primary-alt)",
        accent: "var(--color-accent)",
        text: "var(--color-text)",
        "text-muted": "var(--color-text-muted)",
        border: "var(--color-border)",
        bubbleMe: "var(--color-bubble-me)",
        bubbleThem: "var(--color-bubble-them)",
        "bubbleMe-text": "var(--color-bubble-me-text)",
        "bubbleThem-text": "var(--color-bubble-them-text)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
