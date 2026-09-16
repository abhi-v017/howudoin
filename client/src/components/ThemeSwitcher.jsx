import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "../context/ThemeContext.jsx";

export default function ThemeSwitcher() {
  const { theme, setTheme, themes } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const current = themes.find((t) => t.id === theme);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-surface text-sm hover:bg-surface-alt transition"
        title="Change theme"
      >
        <span
          className="w-3.5 h-3.5 rounded-full border border-border"
          style={{ backgroundColor: current?.swatch }}
        />
        <span className="hidden sm:inline">{current?.label}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-surface border border-border rounded-xl shadow-lg overflow-hidden z-50">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTheme(t.id);
                setOpen(false);
              }}
              className={`flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-surface-alt transition ${
                t.id === theme ? "font-semibold" : ""
              }`}
            >
              <span
                className="w-3.5 h-3.5 rounded-full border border-border"
                style={{ backgroundColor: t.swatch }}
              />
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
