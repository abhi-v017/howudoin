import React, { useState } from "react";
import api from "../api/axios";
import Avatar from "./Avatar.jsx";

export default function SearchUser({ onStartChat }) {
  const [uid, setUid] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    setError("");
    setResult(null);
    const clean = uid.trim();
    if (!/^[A-Z0-9]{6}$/.test(clean)) {
      setError("Enter a valid 6-character UID (letters & numbers)");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get(`/users/search/${clean}`);
      setResult(data.user);
    } catch (err) {
      setError(err.response?.data?.message || "User not found");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="z-10 w-full">
      <form onSubmit={handleSearch} className="flex gap-3 bg-surface shadow-clay-input rounded-full p-1.5">
        <input
          value={uid}
          onChange={(e) => setUid(e.target.value.toUpperCase())}
          maxLength={6}
          placeholder="Search UID..."
          className="flex-1 min-w-0 px-4 py-2 bg-transparent text-sm tracking-wider focus:outline-none text-text placeholder-text-muted"
        />
        <button
          type="submit"
          disabled={loading}
          className="shrink-0 px-4 py-2 rounded-full bg-surface shadow-clay-btn hover:shadow-clay-btn-active transition disabled:opacity-60 text-sm font-medium text-text"
        >
          {loading ? "…" : "🔍"}
        </button>
      </form>

      {error && <p className="text-xs text-red-400 mt-3 px-2">{error}</p>}

      {result && (
        <div className="mt-4 flex items-center gap-3 p-3 rounded-2xl bg-surface/50 backdrop-blur-sm border border-border shadow-clay-card">
          <Avatar user={result} size={36} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-text">{result.username}</p>
            <p className="text-xs text-text-muted">UID: {result.uid}</p>
          </div>
          <button
            onClick={() => {
              onStartChat(result);
              setUid("");
              setResult(null);
            }}
            className="text-xs px-4 py-2 rounded-xl bg-primary text-bubbleMe-text shadow-clay-btn hover:shadow-clay-btn-active transition"
          >
            Chat
          </button>
        </div>
      )}
    </div>
  );
}