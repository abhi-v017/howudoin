"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { ThemeSelector } from "@/components/ui/ThemeSelector";
import { Copy, Check, LogOut, Radio } from "lucide-react";

export function UserProfileDock() {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const handleCopyId = () => {
    const idToCopy = user.uniqueId || user.id;
    navigator.clipboard.writeText(idToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cleanUsername = user.username || "Anonymous";
  const shortId = user.uniqueId || user.id;

  return (
    <div className="glass-panel p-3 rounded-2xl flex items-center justify-between gap-3 border border-white/10 shadow-glass">
      {/* User Meta */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative flex-shrink-0">
          <img
            src={user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`}
            alt={cleanUsername}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 object-cover"
          />
          {/* Socket connectivity status dot */}
          <span
            className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-black ${
              isConnected ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-amber-400"
            }`}
            title={isConnected ? "Realtime Socket Active" : "Reconnecting..."}
          />
        </div>

        <div className="min-w-0 flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm text-white truncate">
              {cleanUsername}
            </span>
          </div>

          {/* 1-Click Copy Unique ID Capsule */}
          <button
            onClick={handleCopyId}
            title="Click to copy Unique ID"
            className="group flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-white transition-all text-left"
          >
            <span className="truncate opacity-80 group-hover:opacity-100">
              {shortId}
            </span>
            {copied ? (
              <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
            ) : (
              <Copy className="w-3 h-3 opacity-50 group-hover:opacity-100 flex-shrink-0" />
            )}
          </button>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <ThemeSelector />
        <button
          onClick={logout}
          title="Log Out"
          className="glass-pill p-2 rounded-full text-zinc-400 hover:text-red-400 hover:border-red-500/30 transition-all text-xs"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
