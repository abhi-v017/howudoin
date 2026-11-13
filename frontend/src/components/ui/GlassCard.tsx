import React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "panel" | "pill" | "interactive";
}

export function GlassCard({
  children,
  className,
  variant = "panel",
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl transition-all duration-300",
        variant === "panel" && "glass-panel shadow-glass",
        variant === "pill" && "glass-pill rounded-full",
        variant === "interactive" && "glass-panel glass-panel-hover cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
