"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Sparkles, Key, User as UserIcon, ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { LogoLoader } from "@/components/ui/LogoLoader";

const CODENAMES = ["Shadow", "Phantom", "Ghost", "Viper", "Nexus", "Cipher", "Nova", "Apex", "Mirage", "Spectre", "Krypton", "Zenith"];

export function AuthModal() {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<"quick" | "login" | "custom">("quick");
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleQuickRegister = async () => {
    setError(null);
    setLoading(true);
    const randomCodename = CODENAMES[Math.floor(Math.random() * CODENAMES.length)];
    const randomPass = "anon_" + Math.random().toString(36).slice(-8);

    try {
      await register(randomCodename, randomPass);
    } catch (err: any) {
      setError(err.message || "Failed to create anonymous account");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setError(null);
    setLoading(true);

    try {
      if (tab === "login") {
        await login(username, password);
      } else {
        await register(username, password);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Header with Custom Logo */}
        <div className="text-center mb-6 relative z-10 flex flex-col items-center">
          <div className="mb-3">
            <Logo size="xl" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-1.5">
            <span>howudoin</span>
            <span
              className="w-2 h-2 rounded-full inline-block animate-pulse"
              style={{ backgroundColor: "var(--accent-color)" }}
            />
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs">
            Zero emails. Zero phone numbers. Pure encrypted anonymity.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex p-1 mb-6 rounded-xl glass-pill text-xs font-medium">
          <button
            onClick={() => { setTab("quick"); setError(null); }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              tab === "quick" ? "bg-white/10 text-white font-semibold shadow-sm" : "text-zinc-400 hover:text-white"
            }`}
          >
            ⚡ Quick Generate
          </button>
          <button
            onClick={() => { setTab("login"); setError(null); }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              tab === "login" ? "bg-white/10 text-white font-semibold shadow-sm" : "text-zinc-400 hover:text-white"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => { setTab("custom"); setError(null); }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              tab === "custom" ? "bg-white/10 text-white font-semibold shadow-sm" : "text-zinc-400 hover:text-white"
            }`}
          >
            Custom Register
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs text-center">
            {error}
          </div>
        )}

        {/* Tab Content */}
        {tab === "quick" ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-xs text-zinc-400 leading-relaxed">
              Generate an anonymous codename (e.g., <code className="text-white font-mono font-medium">Phantom</code> with Unique ID <code className="text-white font-mono font-medium">phantom_4921</code>). You can share this ID with peers to connect directly.
            </div>

            <button
              onClick={handleQuickRegister}
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              style={{
                backgroundColor: "var(--accent-color)",
                color: "var(--accent-text)",
              }}
            >
              {loading ? (
                <LogoLoader variant="inline" size={18} label="Generating identity..." />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Anonymous Identity</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                {tab === "login" ? "Username or Unique ID" : "Desired Username"}
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={tab === "login" ? "e.g. abekrox or abekrox_1971" : "e.g. abekrox"}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-white/30 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-white/30 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 mt-2"
              style={{
                backgroundColor: "var(--accent-color)",
                color: "var(--accent-text)",
              }}
            >
              {loading ? (
                <LogoLoader variant="inline" size={18} label="Authenticating..." />
              ) : (
                <>
                  <span>{tab === "login" ? "Log In" : "Create Account"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
