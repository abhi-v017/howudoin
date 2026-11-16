"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { PRESET_AVATARS, PresetAvatar } from "@/constants/avatars";
import {
  X,
  User as UserIcon,
  Sparkles,
  ShieldCheck,
  Check,
  Copy,
  Shuffle,
  Palette,
  Loader2,
  AlertCircle,
  AtSign,
} from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const THEME_OPTIONS = [
  { id: "mint", label: "Mint", color: "#86efac" },
  { id: "lavender", label: "Lavender", color: "#d8b4fe" },
  { id: "peach", label: "Peach", color: "#fed7aa" },
  { id: "sky", label: "Sky", color: "#7dd3fc" },
  { id: "rose", label: "Rose", color: "#fbcfe8" },
];

const STATUS_PRESETS = [
  "Available",
  "Working remotely",
  "Focus mode",
  "Busy",
  "Away for a bit",
];

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user, updateProfile, theme, setTheme } = useAuth();

  const [activeTab, setActiveTab] = useState<"profile" | "appearance" | "account">("profile");
  const [avatarCategory, setAvatarCategory] = useState<string>("All");

  // Form State
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("mint");

  // UX Feedback State
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Initialize state whenever modal opens or user updates
  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setBio(user.bio || "");
      setSelectedAvatar(
        user.avatarUrl ||
          `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}&backgroundColor=050505`
      );
      setSelectedTheme(user.theme || theme || "mint");
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [user, theme, isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const handleCopyId = () => {
    const idToCopy = user.uniqueId || user.id;
    navigator.clipboard.writeText(idToCopy);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleGenerateRandomAvatar = () => {
    const randomSeed = "bot_" + Math.random().toString(36).substring(2, 9);
    const newAvatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${randomSeed}&backgroundColor=050505`;
    setSelectedAvatar(newAvatar);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setErrorMsg("Username cannot be empty");
      return;
    }

    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      setErrorMsg("Username must be between 3 and 30 characters");
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(cleanUsername)) {
      setErrorMsg("Username can only contain letters, numbers, underscores, and hyphens");
      return;
    }

    if (bio.length > 200) {
      setErrorMsg("Bio cannot exceed 200 characters");
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        username: cleanUsername,
        bio: bio.trim(),
        avatarUrl: selectedAvatar,
        theme: selectedTheme,
      });

      setSuccessMsg("Profile saved successfully");
      setTimeout(() => {
        setSuccessMsg(null);
      }, 2500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const categories = ["All", "Cyber Bot", "Persona", "Identicon", "Abstract"];
  const filteredAvatars =
    avatarCategory === "All"
      ? PRESET_AVATARS
      : PRESET_AVATARS.filter((a) => a.category === avatarCategory);

  const selectedPresetMatch = PRESET_AVATARS.find((a) => a.url === selectedAvatar);
  const currentAvatarLabel = selectedPresetMatch
    ? `${selectedPresetMatch.name} (${selectedPresetMatch.category})`
    : "Custom Privacy Seed";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      {/* Backdrop click (desktop only) */}
      <div className="hidden sm:block absolute inset-0" onClick={onClose} />

      {/* Modal Card - Fullscreen on mobile, rounded card on desktop */}
      <div className="relative w-full h-[100dvh] sm:h-auto sm:max-h-[88vh] sm:max-w-xl md:max-w-2xl bg-[#08080a] sm:border border-white/10 sm:rounded-3xl rounded-none shadow-2xl flex flex-col z-10 overflow-hidden">
        {/* Header Bar */}
        <div className="px-5 sm:px-6 py-4 border-b border-white/10 flex items-center justify-between flex-shrink-0 bg-black/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white flex-shrink-0">
              <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-300" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide truncate">
                Account Settings
              </h2>
              <p className="text-[11px] sm:text-xs text-zinc-400 truncate">
                Identity, bio & privacy avatar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 sm:p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
            title="Close Settings (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Responsive Segmented Tabs */}
        <div className="flex border-b border-white/10 bg-black/30 px-3 sm:px-6 gap-1 sm:gap-2 flex-shrink-0">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex-1 py-3 px-2 text-xs font-medium border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "profile"
                ? "border-emerald-400 text-white font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <UserIcon className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Profile<span className="hidden sm:inline"> & Avatar</span></span>
          </button>
          <button
            onClick={() => setActiveTab("appearance")}
            className={`flex-1 py-3 px-2 text-xs font-medium border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "appearance"
                ? "border-emerald-400 text-white font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Palette className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Theme<span className="hidden sm:inline"> & Accent</span></span>
          </button>
          <button
            onClick={() => setActiveTab("account")}
            className={`flex-1 py-3 px-2 text-xs font-medium border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "account"
                ? "border-emerald-400 text-white font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Account<span className="hidden sm:inline"> & Security</span></span>
          </button>
        </div>

        {/* Status Alerts */}
        {errorMsg && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 animate-in fade-in flex-shrink-0">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in flex-shrink-0">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{successMsg}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6 overscroll-contain">
          {activeTab === "profile" && (
            <div className="space-y-5 sm:space-y-6">
              {/* Live Preview Card */}
              <div className="glass-panel p-3.5 sm:p-4 rounded-2xl border border-white/10 bg-black/40 flex items-center gap-3.5 sm:gap-4">
                <div className="relative flex-shrink-0">
                  <img
                    src={selectedAvatar}
                    alt={username || "Avatar"}
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-zinc-900 border border-white/10 object-cover shadow-lg"
                  />
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-black bg-emerald-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <span className="text-sm sm:text-base font-bold text-white truncate max-w-[180px] sm:max-w-[240px]">
                      {username.trim() || "Anonymous"}
                    </span>
                    <span className="text-[11px] sm:text-xs font-mono text-zinc-500">
                      #{user.tag || "0000"}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2 break-words">
                    {bio.trim() || "Hey there! I am using this private chat app."}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full glass-pill border border-white/5 text-zinc-400 truncate max-w-full">
                      ID: {user.uniqueId || user.id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Username Input */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <AtSign className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    maxLength={30}
                    placeholder="Enter your handle..."
                    className="w-full pl-10 pr-4 py-2.5 bg-black/60 border border-white/10 rounded-xl text-base sm:text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-400/50 transition-all"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1.5">
                  Letters, numbers, underscores, and hyphens (3–30 characters).
                </p>
              </div>

              {/* Bio & Status Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Bio & Status
                  </label>
                  <span className="text-[11px] font-mono text-zinc-500">
                    {bio.length}/200
                  </span>
                </div>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={200}
                  rows={2}
                  placeholder="Tell others what you're up to..."
                  className="w-full px-3.5 py-2.5 bg-black/60 border border-white/10 rounded-xl text-base sm:text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-400/50 transition-all resize-none"
                />

                {/* Quick Status Chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {STATUS_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setBio(preset)}
                      className="text-[11px] px-2.5 py-1 rounded-lg glass-pill text-zinc-400 hover:text-white hover:border-white/20 transition-all"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preset Avatar Selection Grid */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="min-w-0 pr-2">
                    <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block">
                      Choose Privacy Avatar
                    </label>
                    <span className="text-[11px] text-zinc-400 truncate block">
                      Active: <strong className="text-zinc-200">{currentAvatarLabel}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateRandomAvatar}
                    className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 glass-pill px-3 py-1.5 rounded-xl transition-all flex-shrink-0"
                    title="Generate a unique random avatar seed"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>Randomize</span>
                  </button>
                </div>

                {/* Filter Pills - Responsive horizontal scroll without truncation */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-2.5 scrollbar-none no-scrollbar touch-pan-x -mx-1 px-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setAvatarCategory(cat)}
                      className={`flex-shrink-0 text-xs px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap ${
                        avatarCategory === cat
                          ? "bg-white text-black font-semibold shadow-sm"
                          : "glass-pill text-zinc-400 hover:text-white"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Avatar Gallery Grid - Square clean tiles, no 1-letter truncated text */}
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2.5 sm:gap-3 p-3 bg-black/40 border border-white/5 rounded-2xl max-h-56 overflow-y-auto overscroll-contain">
                  {filteredAvatars.map((avatar) => {
                    const isSelected = selectedAvatar === avatar.url;
                    return (
                      <button
                        key={avatar.id}
                        type="button"
                        onClick={() => setSelectedAvatar(avatar.url)}
                        className={`group relative flex items-center justify-center p-1.5 sm:p-2 rounded-2xl transition-all border aspect-square ${
                          isSelected
                            ? "bg-white/10 border-emerald-400 ring-2 ring-emerald-400/30 shadow-md scale-[1.02]"
                            : "border-transparent bg-white/[0.03] hover:bg-white/10 hover:border-white/10"
                        }`}
                        title={`${avatar.name} (${avatar.category})`}
                      >
                        <img
                          src={avatar.url}
                          alt={avatar.name}
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover pointer-events-none"
                        />
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-black shadow-lg ring-2 ring-black">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Pastel Accent Theme
                </label>
                <p className="text-xs text-zinc-400 mb-4">
                  Select your personal visual accent for bubbles, pills, and highlights.
                </p>

                {/* Clean Theme Cards without redundant text clipping */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
                  {THEME_OPTIONS.map((t) => {
                    const isSelected = selectedTheme === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setSelectedTheme(t.id);
                          setTheme(t.id);
                        }}
                        className={`p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all min-h-[52px] ${
                          isSelected
                            ? "bg-white/10 border-white/40 ring-1 ring-white/20 shadow-lg"
                            : "bg-black/40 border-white/10 hover:border-white/20 hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className="w-5 h-5 rounded-full shadow-md flex-shrink-0 ring-1 ring-white/10"
                            style={{ backgroundColor: t.color }}
                          />
                          <span className="text-sm font-semibold text-white truncate">
                            {t.label}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-white stroke-[2.5]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 text-zinc-300 text-xs font-semibold mb-1">
                  <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Dark Mode Active</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  A clean dark theme designed for comfort and reduced eye strain.
                </p>
              </div>
            </div>
          )}

          {activeTab === "account" && (
            <div className="space-y-5">
              {/* User ID Card */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block">
                      User ID
                    </span>
                    <span className="text-sm font-mono text-white font-semibold mt-0.5 block truncate">
                      {user.uniqueId || user.id}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="glass-pill px-3 py-1.5 rounded-xl text-xs text-zinc-300 hover:text-white flex items-center gap-1.5 transition-all flex-shrink-0"
                  >
                    {copiedId ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy ID</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-zinc-500 mt-2">
                  Share this ID with friends so they can easily find and message you.
                </p>
              </div>

              {/* Email / Sign In Method */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block">
                      Account Email
                    </span>
                    <span className="text-sm text-white font-medium mt-0.5 block truncate">
                      {user.email || "No email linked (Guest)"}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex-shrink-0">
                    VERIFIED
                  </span>
                </div>
              </div>

              {/* Privacy Guarantee Box */}
              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-zinc-300 leading-relaxed">
                  <span className="font-semibold text-white block mb-0.5">
                    Privacy Guarantee
                  </span>
                  Your Google profile picture and personal information are never imported or shared. Avatars are selected from simple preset options.
                </div>
              </div>
            </div>
          )}

          {/* Sticky Bottom Actions Bar */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3 flex-shrink-0 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all min-h-[42px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-white text-black hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 min-h-[42px]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
