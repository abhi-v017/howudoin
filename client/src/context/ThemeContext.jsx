import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

export const THEMES = [
  { id: "clay", label: "Clay", swatch: "#A60E35" },
  { id: "light", label: "Light", swatch: "#4f46e5" },
  { id: "dark", label: "Dark", swatch: "#6366f1" },
  { id: "ocean", label: "Ocean", swatch: "#0284c7" },
  { id: "sunset", label: "Sunset", swatch: "#ea580c" },
  { id: "forest", label: "Forest", swatch: "#16a34a" },
  { id: "midnight", label: "Midnight", swatch: "#a855f7" },
];

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "clay");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
