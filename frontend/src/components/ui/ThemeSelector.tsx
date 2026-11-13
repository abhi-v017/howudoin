"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Palette } from "lucide-react";

const themes = [
  { id: "mint", label: "Mint", color: "#86efac" },
  { id: "lavender", label: "Lavender", color: "#d8b4fe" },
  { id: "peach", label: "Peach", color: "#fed7aa" },
  { id: "sky", label: "Sky", color: "#7dd3fc" },
  { id: "rose", label: "Rose", color: "#fbcfe8" },
];

export function ThemeSelector() {
  const { theme, setTheme } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Switch Pastel Accent"
        className="glass-pill p-2 rounded-full text-zinc-400 hover:text-white transition-all flex items-center gap-1.5 text-xs"
      >
        <span
          className="w-3 h-3 rounded-full shadow-sm"
          style={{ backgroundColor: themes.find((t) => t.id === theme)?.color || "#86efac" }}
        />
        <Palette className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 bottom-full mb-2 z-50 glass-panel p-2 rounded-2xl flex gap-1.5 shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-150">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTheme(t.id);
                  setIsOpen(false);
                }}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  theme === t.id ? "scale-110 ring-2 ring-white/30" : "opacity-70 hover:opacity-100"
                }`}
                style={{ backgroundColor: t.color }}
                title={t.label}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
