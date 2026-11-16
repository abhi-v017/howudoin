"use client";

import React, { useState, useEffect } from "react";
import { ConversationMember } from "@/types";
import { api } from "@/lib/api";
import { X, Copy, Check, Phone, Video, User as UserIcon, Users } from "lucide-react";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDirect: boolean;
  user?: {
    id: string;
    username: string;
    tag?: string;
    avatarUrl?: string;
    bio?: string;
    isOnline?: boolean;
    lastSeen?: string;
  } | null;
  groupTitle?: string;
  groupDescription?: string;
  groupAvatar?: string;
  members?: ConversationMember[];
  onStartCall?: (type: "AUDIO" | "VIDEO") => void;
}

export function UserProfileModal({
  isOpen,
  onClose,
  isDirect,
  user,
  groupTitle,
  groupDescription,
  groupAvatar,
  members = [],
  onStartCall,
}: UserProfileModalProps) {
  const [copiedId, setCopiedId] = useState(false);
  const [profileData, setProfileData] = useState(user);

  useEffect(() => {
    setProfileData(user);
    if (isOpen && user?.id) {
      const token = localStorage.getItem("chatapp_token");
      if (token) {
        api.users
          .getProfile(user.id, token)
          .then((res) => {
            if (res.success && res.data) {
              setProfileData((prev) => ({
                ...(prev || user),
                ...res.data,
                isOnline: user.isOnline,
              }));
            }
          })
          .catch(() => {});
      }
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const activeUser = profileData || user;

  const handleCopyId = () => {
    if (!activeUser?.id) return;
    navigator.clipboard.writeText(activeUser.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const username = activeUser?.username || "User";
  const avatarUrl =
    activeUser?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;
  const bio = activeUser?.bio?.trim() || "Hey there! I am using this private chat app.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-[#0a0a0c] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 max-h-[90vh]">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between flex-shrink-0 bg-black/40">
          <div className="flex items-center gap-2">
            {isDirect ? (
              <UserIcon className="w-4 h-4 text-zinc-400" />
            ) : (
              <Users className="w-4 h-4 text-zinc-400" />
            )}
            <h3 className="text-sm font-semibold text-white tracking-wide">
              {isDirect ? "Contact Info" : "Group Info"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {isDirect ? (
            /* 1-on-1 User Profile View */
            <div className="flex flex-col items-center text-center">
              {/* Large Avatar */}
              <div className="relative mb-4">
                <img
                  src={avatarUrl}
                  alt={username}
                  className="w-24 h-24 rounded-3xl bg-zinc-900 border border-white/10 object-cover shadow-xl"
                />
                <span
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-black ${
                    activeUser?.isOnline ? "bg-emerald-400" : "bg-zinc-600"
                  }`}
                  title={activeUser?.isOnline ? "Online" : "Offline"}
                />
              </div>

              {/* Username & Tag */}
              <h2 className="text-xl font-bold text-white tracking-tight">
                {username}
              </h2>
              {activeUser?.tag && (
                <span className="text-xs font-mono text-zinc-500 mt-0.5">
                  #{activeUser.tag}
                </span>
              )}

              {/* Online/Offline status badge */}
              <div className="mt-2 mb-4">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-medium ${
                    activeUser?.isOnline
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-zinc-800/50 text-zinc-400 border border-white/5"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      activeUser?.isOnline ? "bg-emerald-400" : "bg-zinc-500"
                    }`}
                  />
                  {activeUser?.isOnline ? "Online" : "Offline"}
                </span>
              </div>

              {/* Quick Call Actions */}
              {onStartCall && (
                <div className="flex items-center gap-3 w-full mb-5">
                  <button
                    onClick={() => {
                      onClose();
                      onStartCall("AUDIO");
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl glass-panel hover:bg-white/10 text-white font-medium text-xs flex items-center justify-center gap-2 border border-white/10 transition-all"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Voice Call</span>
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      onStartCall("VIDEO");
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl glass-panel hover:bg-white/10 text-white font-medium text-xs flex items-center justify-center gap-2 border border-white/10 transition-all"
                  >
                    <Video className="w-3.5 h-3.5 text-sky-400" />
                    <span>Video Call</span>
                  </button>
                </div>
              )}

              {/* Bio Section */}
              <div className="w-full text-left p-4 rounded-2xl bg-black/40 border border-white/5 mb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1">
                  About
                </span>
                <p className="text-sm text-zinc-200 leading-relaxed break-words">
                  {bio}
                </p>
              </div>

              {/* User ID Section */}
              {activeUser?.id && (
                <div className="w-full p-3.5 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between gap-3">
                  <div className="min-w-0 text-left">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block">
                      User ID
                    </span>
                    <span className="text-xs font-mono text-zinc-300 block truncate mt-0.5">
                      {activeUser.id}
                    </span>
                  </div>
                  <button
                    onClick={handleCopyId}
                    className="glass-pill px-3 py-1.5 rounded-xl text-xs text-zinc-300 hover:text-white flex items-center gap-1.5 transition-all flex-shrink-0"
                    title="Copy User ID"
                  >
                    {copiedId ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Group Chat Info View */
            <div className="space-y-5">
              <div className="flex flex-col items-center text-center">
                <img
                  src={
                    groupAvatar ||
                    `https://api.dicebear.com/7.x/identicon/svg?seed=${groupTitle || "group"}`
                  }
                  alt={groupTitle || "Group"}
                  className="w-20 h-20 rounded-3xl bg-zinc-900 border border-white/10 object-cover shadow-xl mb-3"
                />
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {groupTitle || "Group Chat"}
                </h2>
                {groupDescription && (
                  <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                    {groupDescription}
                  </p>
                )}
                <span className="text-[11px] text-zinc-500 mt-1">
                  {members.length} {members.length === 1 ? "member" : "members"}
                </span>
              </div>

              {/* Members List */}
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block mb-2 px-1">
                  Members
                </span>
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {members.map((m) => {
                    const memberName = m.user?.username || "Anonymous";
                    const memberAvatar =
                      m.user?.avatarUrl ||
                      `https://api.dicebear.com/7.x/bottts/svg?seed=${memberName}`;
                    return (
                      <div
                        key={m.id || m.userId}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5"
                      >
                        <div className="relative flex-shrink-0">
                          <img
                            src={memberAvatar}
                            alt={memberName}
                            className="w-9 h-9 rounded-xl object-cover bg-zinc-900 border border-white/10"
                          />
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-black ${
                              m.user?.isOnline ? "bg-emerald-400" : "bg-zinc-600"
                            }`}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white truncate">
                              {memberName}
                            </span>
                            {m.role === "ADMIN" && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Admin
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-400 truncate">
                            {m.user?.bio || "No status set"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
