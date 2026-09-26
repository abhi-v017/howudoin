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
      boxShadow: {
        /* Deep dark outer shadow + very subtle light top-left edge */
        'clay-card': '10px 10px 30px rgba(0, 0, 0, 0.7), -4px -4px 12px rgba(255, 255, 255, 0.03), inset 1px 1px 2px rgba(255, 255, 255, 0.05), inset -1px -1px 2px rgba(0, 0, 0, 0.4)',
        /* Buttons/icons have a tighter pop */
        'clay-btn': '5px 5px 15px rgba(0, 0, 0, 0.6), -2px -2px 8px rgba(255, 255, 255, 0.03), inset 1px 1px 2px rgba(255, 255, 255, 0.05), inset -1px -1px 2px rgba(0, 0, 0, 0.3)',
        /* Active buttons are pushed in */
        'clay-btn-active': 'inset 5px 5px 15px rgba(0, 0, 0, 0.6), inset -2px -2px 8px rgba(255, 255, 255, 0.02)',
        /* Inputs are pushed in */
        'clay-input': 'inset 4px 4px 10px rgba(0, 0, 0, 0.7), inset -2px -2px 6px rgba(255, 255, 255, 0.02)',
        /* Avatar ring */
        'clay-avatar': '6px 6px 12px rgba(0, 0, 0, 0.5), -2px -2px 6px rgba(255, 255, 255, 0.03)',
      },
    },
  },
  plugins: [],
};
