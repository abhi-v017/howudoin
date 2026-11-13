"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Conversation } from "@/types";
import { X, Search, UserPlus, Users, ArrowRight } from "lucide-react";
import { LogoLoader } from "@/components/ui/LogoLoader";

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConversationCreated: (conversation: Conversation) => void;
}

export function NewChatModal({ isOpen, onClose, onConversationCreated }: NewChatModalProps) {
  const { token, user } = useAuth();
  const [tab, setTab] = useState<"direct" | "group">("direct");

  // Direct chat state
  const [recipientInput, setRecipientInput] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isStartingDirect, setIsStartingDirect] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Group chat state
  const [groupTitle, setGroupTitle] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (query: string) => {
    setRecipientInput(query);
    setError(null);
    if (!token || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await api.users.search(query, token);
      if (res.success && res.data) {
        setSearchResults(res.data);
      }
    } catch {
      // Ignore
    } finally {
      setIsSearching(false);
    }
  };

  const handleStartDirectWithUser = async (targetIdOrUsername: string) => {
    if (!token) return;
    setError(null);
    setIsStartingDirect(true);

    try {
      const res = await api.conversations.getOrCreateDirect(
        { recipientId: targetIdOrUsername },
        token
      );
      if (res.success && res.data) {
        onConversationCreated(res.data);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Failed to start conversation");
    } finally {
      setIsStartingDirect(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !groupTitle.trim()) return;

    setError(null);
    setIsCreatingGroup(true);

    try {
      const res = await api.conversations.createGroup(
        { title: groupTitle.trim(), description: groupDesc.trim() || undefined },
        token
      );
      if (res.success && res.data) {
        onConversationCreated(res.data);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || "Failed to create group");
    } finally {
      setIsCreatingGroup(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="w-full max-w-md glass-panel p-6 rounded-3xl border border-white/10 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-full text-zinc-400 hover:text-white glass-pill"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-xl font-bold text-white mb-1">New Conversation</h3>
        <p className="text-xs text-zinc-400 mb-5">
          Connect anonymously via username or unique ID.
        </p>

        {/* Tab switch */}
        <div className="flex p-1 mb-5 rounded-xl glass-pill text-xs font-medium">
          <button
            onClick={() => { setTab("direct"); setError(null); }}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              tab === "direct" ? "bg-white/10 text-white font-semibold shadow-sm" : "text-zinc-400 hover:text-white"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Direct 1-on-1</span>
          </button>
          <button
            onClick={() => { setTab("group"); setError(null); }}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              tab === "group" ? "bg-white/10 text-white font-semibold shadow-sm" : "text-zinc-400 hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Group Chat</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
            {error}
          </div>
        )}

        {tab === "direct" ? (
          <div className="space-y-4">
            <div>
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={recipientInput}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search username or enter ID (e.g. Spectre_2318)"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-white/30"
                />
                {isSearching && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    <LogoLoader variant="inline" size={16} />
                  </div>
                )}
              </div>
            </div>

            {/* Quick action with exact input if no results yet */}
            {recipientInput.trim().length > 0 && searchResults.length === 0 && !isSearching && (
              <button
                onClick={() => handleStartDirectWithUser(recipientInput.trim())}
                disabled={isStartingDirect}
                className="w-full p-3 rounded-xl glass-pill hover:bg-white/10 text-xs text-white flex items-center justify-between transition-all"
              >
                <span>Start chat with <strong>"{recipientInput.trim()}"</strong></span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {/* Search Result Suggestions */}
            {searchResults.length > 0 && (
              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                {searchResults.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => handleStartDirectWithUser(u.id)}
                    className="p-2.5 rounded-xl glass-panel-hover flex items-center justify-between cursor-pointer border border-transparent hover:border-white/10 transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={u.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`}
                        alt={u.username}
                        className="w-8 h-8 rounded-lg bg-white/5 object-cover"
                      />
                      <div>
                        <div className="text-sm font-semibold text-white">{u.username}</div>
                        <div className="text-[11px] font-mono text-zinc-400">{u.uniqueId || u.id}</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-500" />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleCreateGroup} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Group Title</label>
              <input
                type="text"
                value={groupTitle}
                onChange={(e) => setGroupTitle(e.target.value)}
                placeholder="e.g. Secret Cyber Chamber"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description (optional)</label>
              <textarea
                value={groupDesc}
                onChange={(e) => setGroupDesc(e.target.value)}
                placeholder="What is this group about?"
                rows={2}
                className="w-full px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-white/30 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isCreatingGroup}
              className="w-full py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              style={{
                backgroundColor: "var(--accent-color)",
                color: "var(--accent-text)",
              }}
            >
              {isCreatingGroup ? (
                <LogoLoader variant="inline" size={16} label="Creating room..." />
              ) : (
                <span>Create Group</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
