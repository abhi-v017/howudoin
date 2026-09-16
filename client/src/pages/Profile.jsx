import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext.jsx";
import Avatar from "../components/Avatar.jsx";
import ThemeSwitcher from "../components/ThemeSwitcher.jsx";

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
    <div className="min-h-screen bg-bg px-4 py-6 flex flex-col items-center">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="text-sm text-primary font-medium">
            ← Back to chats
          </Link>
          <ThemeSwitcher />
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col items-center">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="relative group"
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
              className="mt-3 flex items-center gap-2 px-3 py-1 rounded-full bg-surface-alt border border-border text-xs font-mono tracking-wider hover:bg-border transition"
              title="Copy your UID"
            >
              UID: {user.uid} {copied ? "✓" : "⧉"}
            </button>
            <p className="text-[11px] text-text-muted mt-1">
              Share this UID so others can find and message you
            </p>
          </div>

          <form onSubmit={handleSave} className="mt-6 space-y-3">
            <div>
              <label className="text-xs text-text-muted">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                minLength={2}
                required
                className="w-full mt-1 px-3.5 py-2.5 rounded-lg bg-surface-alt border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 200))}
                rows={3}
                placeholder="Tell people a little about you…"
                className="w-full mt-1 px-3.5 py-2.5 rounded-lg bg-surface-alt border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-[11px] text-text-muted text-right mt-0.5">{bio.length}/200</p>
            </div>

            {message && <p className="text-xs text-primary">{message}</p>}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 rounded-lg bg-primary text-bubbleMe-text text-sm font-semibold hover:bg-primary-alt transition disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </form>

          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="w-full mt-3 py-2.5 rounded-lg border border-border text-sm font-medium text-red-500 hover:bg-surface-alt transition"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
