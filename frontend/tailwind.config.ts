import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // True pitch blacks
        pitch: {
          950: "#000000",
          900: "#040406",
          850: "#08080d",
          800: "#0f0f15",
          700: "#171722",
        },
        // Soft pastel highlights (no loud neon/AI colors)
        pastel: {
          mint: "#a7f3d0",
          sage: "#86efac",
          lavender: "#d8b4fe",
          lilac: "#c084fc",
          peach: "#fed7aa",
          sky: "#bae6fd",
          rose: "#fecdd3",
        },
      },
      backdropBlur: {
        xs: "2px",
        "2xl": "40px",
        "3xl": "64px",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.5)",
        "glass-sm": "0 4px 16px 0 rgba(0, 0, 0, 0.4)",
        "pastel-glow": "0 0 25px -5px var(--accent-glow)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 6s ease-in-out infinite",
        "wave": "wave 1.2s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        wave: {
          "0%, 100%": { transform: "scaleY(0.4)" },
          "50%": { transform: "scaleY(1)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
