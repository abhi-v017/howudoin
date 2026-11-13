"use client";

import React, { useState } from "react";
import { Conversation } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { formatDate } from "@/lib/utils";
import { Plus, Search, Users } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { NewChatModal } from "./NewChatModal";

interface ConversationListProps {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  onSelectConversation: (conv: Conversation) => void;
  onConversationCreated: (conv: Conversation) => void;
}

export function ConversationList({
  conversations,
  activeConversation,
  onSelectConversation,
  onConversationCreated,
}: ConversationListProps) {
  const { user } = useAuth();
  const { onlineUserIds } = useSocket();
  const [filterQuery, setFilterQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredConversations = conversations.filter((conv) => {
    const isDirect = conv.type === "DIRECT";
    const otherMember = isDirect
      ? conv.members?.find((m) => m.userId !== user?.id)
      : null;
    const title = conv.displayTitle || otherMember?.user?.username || conv.title || "";
    return title.toLowerCase().includes(filterQuery.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full p-3 overflow-hidden">
      {/* Search Bar & New Chat Button */}
      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search or start new chat..."
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/20 transition-all"
          />
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="p-2 rounded-xl glass-pill hover:bg-white/10 text-white transition-all flex items-center justify-center flex-shrink-0"
          title="Start 1-on-1 or Create Group"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Conversations Scrollable List */}
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {filteredConversations.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-zinc-500">
            <Logo size="sm" className="opacity-40 mb-2" />
            <p className="text-xs">No chats yet</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-2 text-xs text-zinc-400 hover:text-white underline underline-offset-4"
            >
              Start a new conversation
            </button>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isActive = activeConversation?.id === conv.id;
            const isDirect = conv.type === "DIRECT";
            const otherMember = isDirect
              ? conv.members?.find((m) => m.userId !== user?.id)
              : null;
            const isOnline = otherMember ? onlineUserIds.has(otherMember.userId) : false;

            const title =
              conv.displayTitle ||
              otherMember?.user?.username ||
              conv.title ||
              "Chat";

            const avatar =
              conv.displayAvatar ||
              otherMember?.user?.avatarUrl ||
              (isDirect
                ? `https://api.dicebear.com/7.x/bottts/svg?seed=${title}`
                : `https://api.dicebear.com/7.x/identicon/svg?seed=${title}`);

            const lastMsg = conv.lastMessage;

            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv)}
                className={`group p-2.5 px-3 rounded-2xl flex items-center gap-3 cursor-pointer transition-all duration-150 border ${
                  isActive
                    ? "bg-white/[0.1] border-white/20 shadow-sm"
                    : "border-transparent hover:bg-white/[0.04]"
                }`}
              >
                {/* Avatar with Online Dot */}
                <div className="relative flex-shrink-0">
                  <img
                    src={avatar}
                    alt={title}
                    className="w-11 h-11 rounded-xl bg-white/5 object-cover border border-white/10"
                  />
                  {isDirect && (
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-black transition-all ${
                        isOnline ? "bg-emerald-400 shadow-[0_0_6px_#34d399]" : "bg-zinc-600"
                      }`}
                    />
                  )}
                  {!isDirect && (
                    <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-white/10">
                      <Users className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-semibold text-sm text-white truncate">
                      {title}
                    </span>
                    {lastMsg && (
                      <span className="text-[10px] text-zinc-400 flex-shrink-0">
                        {formatDate(lastMsg.createdAt)}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-400 truncate">
                    {lastMsg ? (
                      lastMsg.type === "TEXT" ? (
                        lastMsg.content
                      ) : (
                        `[${lastMsg.type.toLowerCase()}] ${lastMsg.mediaName || "Attachment"}`
                      )
                    ) : (
                      <span className="italic opacity-60">No messages yet</span>
                    )}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Chat Modal */}
      <NewChatModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConversationCreated={onConversationCreated}
      />
    </div>
  );
}
