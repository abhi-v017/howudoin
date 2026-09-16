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
    <div className="p-3 border-b border-border">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={uid}
          onChange={(e) => setUid(e.target.value.toUpperCase())}
          maxLength={6}
          placeholder="Find by 6-char UID"
          className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-surface-alt border border-border text-sm tracking-wider focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-3 py-2 rounded-lg bg-primary text-bubbleMe-text text-sm font-medium hover:bg-primary-alt transition disabled:opacity-60"
        >
          {loading ? "…" : "Search"}
        </button>
      </form>

      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

      {result && (
        <div className="mt-3 flex items-center gap-3 p-2 rounded-lg bg-surface-alt">
          <Avatar user={result} size={36} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{result.username}</p>
            <p className="text-xs text-text-muted">UID: {result.uid}</p>
          </div>
          <button
            onClick={() => {
              onStartChat(result);
              setUid("");
              setResult(null);
            }}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-primary text-bubbleMe-text hover:bg-primary-alt transition"
          >
            Chat
          </button>
        </div>
      )}
    </div>
  );
}