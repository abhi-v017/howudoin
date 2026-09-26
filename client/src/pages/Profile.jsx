import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext.jsx";
import Avatar from "../components/Avatar.jsx";

export default function Profile() {
  const { user, updateLocalUser, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [username, setUsername] = useState(user?.username || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const { data } = await api.put("/users/me", { username, bio });
      updateLocalUser(data.user);
      setMessage("Profile updated");
    } catch (err) {
      setMessage(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarPick(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage("Please select an image file");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const { data } = await api.post("/users/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      updateLocalUser(data.user);
    } catch (err) {
      setMessage(err.response?.data?.message || "Avatar upload failed");
    } finally {
      setUploading(false);
    }
  }

  function copyUID() {
    navigator.clipboard.writeText(user.uid);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-bg px-4 py-6 flex flex-col items-center">
      {/* Decorative background orbs for glassmorphism effect */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-surface-alt/80 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="flex items-center mb-6">
          <Link to="/" className="text-sm text-primary font-medium hover:underline">
            ← Back to chats
          </Link>
        </div>

        <div className="bg-surface/80 rounded-[2rem] shadow-clay-card backdrop-blur-2xl border border-white/10 overflow-hidden">
          {/* Cover Image */}
          <div className="w-full h-32 bg-surface-alt relative">
            <img 
              src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" 
              alt="Cover" 
              className="w-full h-full object-cover opacity-60"
            />
          </div>

          <div className="px-8 pb-8 flex flex-col items-center">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="relative group rounded-full -mt-12 border-4 border-[#272831] shadow-clay-avatar bg-[#272831]"
              title="Change profile picture"
            >
              <Avatar user={user} size={88} />
              <span className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs transition">
                {uploading ? "…" : "Change"}
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarPick}
            />

            <button
              onClick={copyUID}
              className="mt-4 flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface shadow-clay-btn hover:shadow-clay-btn-active text-xs font-mono tracking-wider text-text transition"
              title="Copy your UID"
            >
              UID: {user.uid} {copied ? "✓" : "⧉"}
            </button>
            <p className="text-[11px] text-text-muted mt-2 text-center">
              Share this UID so others can find and message you
            </p>
          </div>

          <form onSubmit={handleSave} className="px-8 space-y-4">
            <div>
              <label className="text-xs text-text-muted px-2">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                minLength={2}
                required
                className="w-full mt-1 px-4 py-3 rounded-2xl bg-bg border border-transparent shadow-clay-input text-text text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted px-2">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 200))}
                rows={3}
                placeholder="Tell people a little about you…"
                className="w-full mt-1 px-4 py-3 rounded-2xl bg-bg border border-transparent shadow-clay-input text-text placeholder-text-muted text-sm resize-none focus:outline-none"
              />
              <p className="text-[11px] text-text-muted text-right mt-1 px-2">{bio.length}/200</p>
            </div>

            {message && <p className="text-xs text-accent px-2">{message}</p>}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 mt-2 rounded-2xl bg-primary text-white text-sm font-semibold shadow-clay-btn hover:shadow-clay-btn-active transition disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </form>

          <div className="px-8 pb-8 pt-4">
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="w-full py-3 rounded-2xl bg-surface text-sm font-semibold text-red-400 shadow-clay-btn hover:shadow-clay-btn-active transition"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
