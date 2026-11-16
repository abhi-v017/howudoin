"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { Mail, Key, User as UserIcon, ArrowRight, ShieldCheck, AlertCircle, ExternalLink, Check } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { LogoLoader } from "@/components/ui/LogoLoader";

export function AuthModal() {
  const { login, register, loginWithGoogle } = useAuth();
  const [tab, setTab] = useState<"login" | "register">("login");

  // Form Fields
  const [email, setEmail] = useState("");
  const [identifier, setIdentifier] = useState(""); // Email or Username for Login
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googlePromptOpen, setGooglePromptOpen] = useState(false);
  const [customClientId, setCustomClientId] = useState("");
  const [savedClientId, setSavedClientId] = useState<string>("");

  const googleBtnContainerRef = useRef<HTMLDivElement | null>(null);

  // Read client ID from env or saved local config
  useEffect(() => {
    const envId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
    const localId = typeof window !== "undefined" ? localStorage.getItem("chatapp_google_client_id") || "" : "";
    const active = envId || localId;
    setSavedClientId(active);
    if (active) setCustomClientId(active);
  }, []);

  // Initialize Google Identity Services
  useEffect(() => {
    if (!savedClientId) return;

    // Load Google Identity Services SDK script
    const scriptId = "google-gsi-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    const initGsi = () => {
      if ((window as any).google?.accounts?.id) {
        try {
          (window as any).google.accounts.id.initialize({
            client_id: savedClientId,
            callback: async (response: any) => {
              if (response.credential) {
                setLoading(true);
                setError(null);
                try {
                  await loginWithGoogle(response.credential);
                } catch (err: any) {
                  setError(err.message || "Google authentication failed");
                } finally {
                  setLoading(false);
                }
              }
            },
          });

          // Render official Google button into container if mounted
          if (googleBtnContainerRef.current) {
            googleBtnContainerRef.current.innerHTML = "";
            (window as any).google.accounts.id.renderButton(googleBtnContainerRef.current, {
              theme: "filled_black",
              size: "large",
              shape: "pill",
              width: 340,
              text: "continue_with",
            });
          }

          // Optional: Display One Tap prompt
          (window as any).google.accounts.id.prompt();
        } catch (e) {
          console.error("Failed to initialize Google Identity Services:", e);
        }
      }
    };

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGsi;
      document.body.appendChild(script);
    } else {
      initGsi();
    }
  }, [savedClientId]);

  const handleGoogleClick = () => {
    if (!savedClientId) {
      setGooglePromptOpen(true);
      return;
    }

    if ((window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.prompt();
    } else {
      setError("Google Sign-In is initializing. Please click again in a moment.");
    }
  };

  const handleSaveCustomClientId = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customClientId.trim()) return;
    const cleanId = customClientId.trim();
    localStorage.setItem("chatapp_google_client_id", cleanId);
    setSavedClientId(cleanId);
    setGooglePromptOpen(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === "login") {
        if (!identifier || !password) {
          throw new Error("Please enter your email/username and password.");
        }
        await login(identifier, password);
      } else {
        if (!email || !username || !password) {
          throw new Error("Please complete all registration fields.");
        }
        if (!email.includes("@") || !email.includes(".")) {
          throw new Error("Please provide a valid email address.");
        }
        await register(email, username, password);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md glass-panel p-7 sm:p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden bg-black/90">
        {/* Header with Custom Vector Logo */}
        <div className="text-center mb-6 relative z-10 flex flex-col items-center">
          <div className="mb-3">
            <Logo size="xl" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-1.5">
            <span>howudoin</span>
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ backgroundColor: "var(--accent-color)" }}
            />
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
            Private messaging, voice &amp; video calls.
          </p>
        </div>

        {/* Tab Switcher: Sign In / Sign Up */}
        <div className="flex p-1 mb-5 rounded-xl glass-pill text-xs font-medium border border-white/10">
          <button
            onClick={() => {
              setTab("login");
              setError(null);
            }}
            className={`flex-1 py-2.5 rounded-lg transition-all ${
              tab === "login"
                ? "bg-white/10 text-white font-semibold shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setTab("register");
              setError(null);
            }}
            className={`flex-1 py-2.5 rounded-lg transition-all ${
              tab === "register"
                ? "bg-white/10 text-white font-semibold shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error message banner */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Primary Action: Continue with Google */}
        <div className="mb-5 flex flex-col items-center">
          {savedClientId ? (
            /* Render official Google button container */
            <div className="w-full flex justify-center min-h-[44px]">
              <div ref={googleBtnContainerRef} className="w-full flex justify-center" />
            </div>
          ) : (
            /* Fallback sleek Google button with 1-click guide trigger */
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] text-white text-xs font-medium transition-all flex items-center justify-center gap-2.5 shadow-sm hover:border-white/30 disabled:opacity-50"
            >
              {/* Google Colorful G SVG */}
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          )}

          <div className="flex items-center gap-3 w-full my-4">
            <div className="h-px bg-white/10 flex-1" />
            <span className="text-[11px] text-zinc-500 font-mono uppercase tracking-wider">
              or with email
            </span>
            <div className="h-px bg-white/10 flex-1" />
          </div>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {tab === "register" ? (
            <>
              {/* Email Address */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-white/30 transition-all"
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Choose Username
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. abekrox"
                    required
                    minLength={3}
                    maxLength={30}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-white/30 transition-all"
                  />
                </div>
              </div>
            </>
          ) : (
            /* Login Identifier: Email or Username */
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Email or Username
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="name@example.com or abekrox"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-white/30 transition-all"
                />
              </div>
            </div>
          )}

          {/* Password */}
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
                minLength={6}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-white/30 transition-all"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 mt-4"
            style={{
              backgroundColor: "var(--accent-color)",
              color: "var(--accent-text)",
            }}
          >
            {loading ? (
              <LogoLoader
                variant="inline"
                size={16}
                label={tab === "login" ? "Authenticating..." : "Creating account..."}
              />
            ) : (
              <>
                <span>{tab === "login" ? "Sign In" : "Create Account"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security Notice */}
        <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
          <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
          <span>One account per email • Rate-limited &amp; protected against spam</span>
        </div>
      </div>

      {/* Google Setup Guide & Quick Config Modal */}
      {googlePromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md glass-panel p-6 sm:p-7 rounded-3xl border border-white/15 bg-zinc-950 text-white shadow-2xl">
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center justify-between">
              <span>Setup Google OAuth (Free in 1 minute)</span>
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-normal"
              >
                <span>Google Console</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </h3>

            <p className="text-xs text-zinc-400 leading-relaxed mb-3">
              Google OAuth 2.0 is 100% free with no credit card required. To enable real Google Sign-In:
            </p>

            <ol className="text-xs text-zinc-300 space-y-1.5 mb-4 list-decimal pl-4 leading-relaxed font-sans">
              <li>Open <strong className="text-white">Google Cloud Console</strong> &gt; Credentials</li>
              <li>Click <strong className="text-white">+ CREATE CREDENTIALS</strong> &gt; <strong className="text-white">OAuth client ID</strong></li>
              <li>Application type: <code className="text-emerald-400">Web application</code></li>
              <li>Authorized JavaScript origins: <code className="text-emerald-400">http://localhost:3000</code></li>
            </ol>

            {/* Quick-Paste Client ID Form */}
            <form onSubmit={handleSaveCustomClientId} className="space-y-3 mb-4">
              <div>
                <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                  Paste your Google Client ID here:
                </label>
                <input
                  type="text"
                  value={customClientId}
                  onChange={(e) => setCustomClientId(e.target.value)}
                  placeholder="xxxx-xxxxxxxx.apps.googleusercontent.com"
                  className="w-full px-3 py-2 rounded-xl bg-black border border-white/15 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-400 font-mono"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={!customClientId.trim()}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-emerald-400 text-black hover:bg-emerald-300 transition-all disabled:opacity-40"
                >
                  Save &amp; Activate Google Sign-In
                </button>
                <button
                  type="button"
                  onClick={() => setGooglePromptOpen(false)}
                  className="py-2.5 px-4 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/15 transition-all text-zinc-300"
                >
                  Cancel
                </button>
              </div>
            </form>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-500">
              <span>Or add to <code className="text-zinc-400">frontend/.env.local</code></span>
              <button
                type="button"
                onClick={() => setGooglePromptOpen(false)}
                className="text-zinc-400 hover:text-white underline underline-offset-2"
              >
                Use Email login instead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
