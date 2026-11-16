"use client";

import React from "react";
import { LOGO_PATH_D } from "./Logo";

export interface LogoLoaderProps {
  variant?: "fullscreen" | "stage" | "inline" | "call";
  animation?: "completion" | "rotation" | "both";
  size?: number;
  label?: string;
  sublabel?: string;
  className?: string;
  color?: string;
}

export function LogoLoader({
  variant = "stage",
  animation = "completion",
  size,
  label,
  sublabel,
  className = "",
  color,
}: LogoLoaderProps) {
  const defaultSize =
    variant === "fullscreen"
      ? 68
      : variant === "call"
      ? 54
      : variant === "inline"
      ? 18
      : 42;

  const logoSize = size || defaultSize;
  const strokeColor = color || "var(--accent-color)";

  // Inline Mini Loader (Buttons & Search Inputs)
  if (variant === "inline") {
    return (
      <div className={`inline-flex items-center gap-2 select-none ${className}`}>
        <div
          className="relative flex items-center justify-center flex-shrink-0"
          style={{ width: logoSize, height: logoSize }}
        >
          <svg
            viewBox="85 60 360 380"
            className="w-full h-full animate-logo-rotate"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Subtle Track */}
            <path
              d={LOGO_PATH_D}
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth="24"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Animated Tracing Arc */}
            <path
              d={LOGO_PATH_D}
              stroke={strokeColor}
              strokeWidth="24"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-logo-draw"
            />
          </svg>
        </div>
        {label && (
          <span className="text-xs font-medium text-zinc-300 font-mono tracking-tight">
            {label}
          </span>
        )}
      </div>
    );
  }

  const isFullscreen = variant === "fullscreen";
  const isCall = variant === "call";

  // Determine rotation/animation classes
  const isRotating = animation === "rotation" || animation === "both";
  const isDrawing = animation === "completion" || animation === "both";

  return (
    <div
      className={`flex flex-col items-center justify-center select-none ${
        isFullscreen
          ? "fixed inset-0 z-50 bg-black flex-1 w-screen h-screen overflow-hidden"
          : isCall
          ? "w-full h-full p-4"
          : "flex-1 h-full p-6"
      } ${className}`}
    >
      {/* Precision Vector Stage (No fuzzy AI glowing blobs) */}
      <div
        className={`relative flex items-center justify-center ${
          isRotating ? "animate-logo-rotate" : ""
        }`}
        style={{
          width: logoSize,
          height: logoSize,
        }}
      >
        <svg
          viewBox="85 60 360 380"
          className="w-full h-full overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle Ghost Track (Shows complete contour elegantly) */}
          <path
            d={LOGO_PATH_D}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="20"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Stroke Completion Animation: Traces cleanly from Point A to Point B */}
          <path
            d={LOGO_PATH_D}
            stroke={strokeColor}
            strokeWidth="20"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={isDrawing ? "animate-logo-draw" : ""}
          />
        </svg>
      </div>

      {/* Classy Understated Typography & Status */}
      <div className="mt-6 flex flex-col items-center text-center max-w-xs relative z-10">
        {label ? (
          <h4 className="text-xs font-semibold tracking-widest text-zinc-300 uppercase font-mono">
            {label}
          </h4>
        ) : isFullscreen ? (
          <div className="flex items-center gap-1.5 mb-1">
            <span className="font-mono font-semibold text-sm text-white tracking-widest uppercase">
              howudoin
            </span>
            <span
              className="w-1.5 h-1.5 rounded-full inline-block"
              style={{ backgroundColor: strokeColor }}
            />
          </div>
        ) : null}

        {sublabel ? (
          <p className="text-[11px] text-zinc-500 mt-1 font-mono tracking-wide">
            {sublabel}
          </p>
        ) : isFullscreen ? (
          <p className="text-[10px] text-zinc-500 font-medium tracking-wider mt-0.5">
            Private &amp; Secure
          </p>
        ) : null}

        {/* Minimalist 3-dot pulse */}
        <div className="flex items-center gap-1.5 mt-2.5 opacity-60">
          <span
            className="w-1 h-1 rounded-full animate-ping"
            style={{ backgroundColor: strokeColor }}
          />
        </div>
      </div>
    </div>
  );
}
