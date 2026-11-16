import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return formatTime(dateString);
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function getInitials(name: string): string {
  if (!name) return "?";
  return name.slice(0, 2).toUpperCase();
}

/**
 * Robustly resolve media URLs across local development and production environments.
 * Handles relative paths, localhost legacy paths, and external CDNs.
 */
export function resolveMediaUrl(url?: string): string {
  if (!url) return "";
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
  const serverOrigin = apiBase.replace(/\/api\/v1\/?$/, "");

  // External URLs (e.g., Google user avatars or Cloud storage)
  if (url.startsWith("http://") || url.startsWith("https://")) {
    if (url.includes("localhost:5000") && !serverOrigin.includes("localhost:5000")) {
      return url.replace(/https?:\/\/localhost:5000/, serverOrigin);
    }
    return url;
  }

  // Relative paths
  return `${serverOrigin}${url.startsWith("/") ? "" : "/"}${url}`;
}
