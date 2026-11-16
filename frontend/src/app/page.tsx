"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { api } from "@/lib/api";
import { Conversation, Message } from "@/types";
import { AuthModal } from "@/components/auth/AuthModal";
import { UserProfileDock } from "@/components/sidebar/UserProfileDock";
import { ConversationList } from "@/components/sidebar/ConversationList";
import { ChatStage } from "@/components/chat/ChatStage";
import { Logo } from "@/components/ui/Logo";
import { LogoLoader } from "@/components/ui/LogoLoader";

export default function Home() {
  const { user, token, isLoading } = useAuth();
  const { socket } = useSocket();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [isFetchingConversations, setIsFetchingConversations] = useState(false);

  // Fetch conversations once logged in
  useEffect(() => {
    if (!token || !user) {
      setConversations([]);
      setActiveConversation(null);
      return;
    }

    setIsFetchingConversations(true);
    api.conversations
      .list(token)
      .then((res) => {
        if (res.success && res.data) {
          setConversations(res.data);
          // Auto-select first conversation on large screens
          if (res.data.length > 0 && window.innerWidth >= 1024) {
            setActiveConversation((prev) => prev || res.data[0]);
          }
        }
      })
      .catch((err) => console.error("Failed to fetch conversations:", err))
      .finally(() => setIsFetchingConversations(false));
  }, [token, user?.id]);

  // Update conversation order and latest message in real-time
  useEffect(() => {
    if (!socket) return;

    const handleMessageArrival = (newMsg: Message) => {
      setConversations((prev) => {
        const index = prev.findIndex((c) => c.id === newMsg.conversationId);
        if (index === -1) return prev;

        const updated = {
          ...prev[index],
          lastMessage: newMsg,
          updatedAt: newMsg.createdAt,
        };

        const remaining = prev.filter((c) => c.id !== newMsg.conversationId);
        return [updated, ...remaining];
      });
    };

    socket.on("message:new", handleMessageArrival);
    return () => {
      socket.off("message:new", handleMessageArrival);
    };
  }, [socket]);

  const handleConversationCreated = (newConv: Conversation) => {
    setConversations((prev) => [newConv, ...prev.filter((c) => c.id !== newConv.id)]);
    setActiveConversation(newConv);
  };

  if (isLoading) {
    return (
      <LogoLoader
        variant="fullscreen"
        label="howudoin"
        sublabel="Loading your chats..."
      />
    );
  }

  return (
    <main className="w-full h-full h-[100dvh] overflow-hidden flex bg-black relative">
      {/* Show Auth Modal if not signed in */}
      {!user && <AuthModal />}

      {/* Full-screen WhatsApp-style 2-pane Layout */}
      <div className="w-full h-full flex overflow-hidden">
        {/* Left Sidebar (Chats List + User Profile) */}
        <aside
          className={`flex-col w-full md:w-[350px] lg:w-[400px] flex-shrink-0 h-full border-r border-white/10 bg-black/60 backdrop-blur-2xl ${
            activeConversation ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Brand Header */}
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between flex-shrink-0 bg-black/40">
            <Logo size="sm" withText />
            <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full glass-pill text-zinc-400 border border-white/5">
              Private Chats
            </span>
          </div>

          {/* User Profile & Theme Dock */}
          <div className="p-3 border-b border-white/10 flex-shrink-0">
            <UserProfileDock />
          </div>

          {/* Conversations List */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <ConversationList
              conversations={conversations}
              activeConversation={activeConversation}
              onSelectConversation={(conv) => setActiveConversation(conv)}
              onConversationCreated={handleConversationCreated}
            />
          </div>
        </aside>

        {/* Right Stage (Active Conversation Chat Screen) */}
        <section
          className={`flex-1 flex-col h-full min-w-0 bg-black/40 backdrop-blur-3xl ${
            !activeConversation ? "hidden md:flex" : "flex"
          }`}
        >
          <ChatStage
            conversation={activeConversation}
            onBack={() => setActiveConversation(null)}
          />
        </section>
      </div>
    </main>
  );
}
