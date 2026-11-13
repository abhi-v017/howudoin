"use client";

import React from "react";

export const LOGO_PATH_D =
  "M 373 174 L 373 100 L 370 89 L 358 80 L 346 78 L 320 79 L 312 82 L 306 87 L 301 95 L 299 109 L 299 166 L 296 178 L 292 186 L 280 198 L 265 205 L 257 206 L 204 205 L 195 201 L 184 189 L 180 172 L 180 102 L 177 90 L 167 81 L 153 78 L 134 78 L 120 81 L 109 92 L 106 106 L 106 395 L 108 407 L 114 416 L 122 421 L 128 422 L 159 422 L 169 419 L 177 411 L 180 400 L 180 333 L 182 319 L 186 310 L 196 300 L 203 296 L 216 294 L 253 294 L 264 292 L 280 284 L 293 269 L 300 253 L 303 240 L 310 227 L 321 216 L 332 210 L 354 206 L 369 206 L 393 209 L 401 213 L 413 224 L 419 237 L 419 263 L 413 276 L 407 282 L 406 285 L 407 309 L 405 311 L 390 308 L 370 296 L 360 294 L 347 294 L 331 297 L 323 301 L 309 314 L 303 324 L 300 335 L 299 393 L 301 406 L 304 412 L 311 419 L 321 422 L 358 421 L 363 419 L 370 412 L 373 401 L 374 357 L 373 337 L 368 328";

export interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | number;
  withText?: boolean;
  className?: string;
  textClassName?: string;
  color?: string;
  onClick?: () => void;
}

const SIZE_MAP = {
  xs: 18,
  sm: 24,
  md: 32,
  lg: 44,
  xl: 64,
  "2xl": 88,
};

export function Logo({
  size = "md",
  withText = false,
  className = "",
  textClassName = "",
  color,
  onClick,
}: LogoProps) {
  const pixelSize = typeof size === "number" ? size : SIZE_MAP[size] || 32;

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 select-none ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
    >
      {/* Precision Vector Geometric Mark (Zero fuzzy AI glows) */}
      <div
        className="relative flex items-center justify-center flex-shrink-0"
        style={{
          width: pixelSize,
          height: pixelSize,
          color: color || "var(--accent-color)",
        }}
      >
        <svg
          viewBox="85 60 360 380"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d={LOGO_PATH_D}
            stroke="currentColor"
            strokeWidth="20"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Understated Brand Typography */}
      {withText && (
        <div className={`flex items-baseline gap-1 ${textClassName}`}>
          <span className="font-semibold tracking-wider text-white font-mono text-sm uppercase">
            howudoin
          </span>
          <span
            className="w-1.5 h-1.5 rounded-full inline-block"
            style={{ backgroundColor: color || "var(--accent-color)" }}
          />
        </div>
      )}
    </div>
  );
}
