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
