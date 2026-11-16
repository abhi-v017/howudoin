"use client";

import React, { useEffect, useRef, useState } from "react";
import { Conversation, Message } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { useCall } from "@/context/CallContext";
import { api } from "@/lib/api";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { TypingIndicator } from "./TypingIndicator";
import { UserProfileModal } from "./UserProfileModal";
import { Phone, Video, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { LogoLoader } from "@/components/ui/LogoLoader";

interface ChatStageProps {
  conversation: Conversation | null;
  onBack?: () => void;
}

export function ChatStage({ conversation, onBack }: ChatStageProps) {
  const { user, token } = useAuth();
  const { socket, joinConversation, leaveConversation, sendSocketMessage, emitTyping, typingUsers, onlineUserIds } = useSocket();
  const { initiateCall } = useCall();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "end",
      });
    }
  };

  // Helper to deduplicate messages by ID
  const appendUniqueMessage = (prev: Message[], msg: Message) => {
    if (prev.some((m) => m.id === msg.id)) {
      return prev;
    }
    return [...prev, msg];
  };

  // Load conversation messages and join socket room
  useEffect(() => {
    if (!conversation || !token) {
      setMessages([]);
      return;
    }

    setIsLoading(true);
    joinConversation(conversation.id);

    api.messages
      .list(conversation.id, token, undefined)
      .then((res) => {
        if (res.success && res.data) {
          setMessages(res.data.messages);
          setTimeout(() => scrollToBottom(false), 50);
        }
      })
      .catch((err) => console.error("Failed to load messages:", err))
      .finally(() => setIsLoading(false));

    return () => {
      leaveConversation(conversation.id);
    };
  }, [conversation?.id, token]);

  // Listen to realtime incoming messages for active conversation
  useEffect(() => {
    if (!socket || !conversation) return;

    const handleNewMessage = (msg: Message) => {
      if (msg.conversationId === conversation.id) {
        setMessages((prev) => appendUniqueMessage(prev, msg));
        setTimeout(() => scrollToBottom(true), 50);
      }
    };

    socket.on("message:new", handleNewMessage);

    return () => {
      socket.off("message:new", handleNewMessage);
    };
  }, [socket, conversation?.id]);

  const handleSendMessage = async (payload: {
    content?: string;
    type?: string;
    mediaUrl?: string;
    mediaName?: string;
    mediaSize?: number;
    mediaMimeType?: string;
  }) => {
    if (!conversation) return;

    try {
      const newMsg = await sendSocketMessage({
        conversationId: conversation.id,
        ...payload,
      });
      // Deduplicated addition
      setMessages((prev) => appendUniqueMessage(prev, newMsg));
      setTimeout(() => scrollToBottom(true), 50);
    } catch {
      // Fallback to REST
      if (token) {
        const res = await api.messages.send(
          { conversationId: conversation.id, ...payload },
          token
        );
        if (res.success && res.data) {
          setMessages((prev) => appendUniqueMessage(prev, res.data));
          setTimeout(() => scrollToBottom(true), 50);
        }
      }
    }
  };

  const handleTyping = (isTyping: boolean) => {
    if (conversation) {
      emitTyping(conversation.id, isTyping);
    }
  };

  // Determine other member details
  const isDirect = conversation?.type === "DIRECT";
  const otherMember = isDirect
    ? conversation?.members?.find((m) => m.userId !== user?.id)
    : null;
  const isOtherOnline = otherMember ? onlineUserIds.has(otherMember.userId) : false;

  // Clean recipient name (Never generic "Conversation"!)
  const recipientName = isDirect
    ? otherMember?.user?.username || conversation?.displayTitle || "Direct Chat"
    : conversation?.title || conversation?.displayTitle || "Group Chat";

  const recipientAvatar =
    conversation?.displayAvatar ||
    otherMember?.user?.avatarUrl ||
    `https://api.dicebear.com/7.x/bottts/svg?seed=${recipientName}`;

  const currentTyping = conversation ? typingUsers[conversation.id] || [] : [];
  const isRecipientTyping = currentTyping.length > 0;

  if (!conversation) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center p-8 text-center bg-black/30 backdrop-blur-xl select-none">
        <div className="mb-4">
          <Logo size="xl" />
        </div>
        <h3 className="text-xl font-bold text-white mb-1.5 font-mono tracking-wider flex items-center gap-1.5">
          <span>howudoin</span>
          <span
            className="w-2 h-2 rounded-full inline-block animate-pulse"
            style={{ backgroundColor: "var(--accent-color)" }}
          />
        </h3>
        <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
          Select a chat from the left or click <strong>&quot;+ New&quot;</strong> to start a conversation.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden relative bg-black/40 backdrop-blur-2xl">
      {/* Top Header Bar */}
      <div className="h-16 px-4 sm:px-6 border-b border-white/10 flex items-center justify-between gap-4 flex-shrink-0 bg-white/[0.02]">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Back Button */}
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-2 -ml-2 rounded-xl text-zinc-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {/* Clickable Profile Info Header */}
          <div
            onClick={() => setIsProfileModalOpen(true)}
            className="flex items-center gap-3 min-w-0 cursor-pointer group hover:opacity-90 transition-opacity"
            title="Click to view details"
          >
            {/* Avatar with Status Ring */}
            <div className="relative flex-shrink-0">
              <img
                src={recipientAvatar}
                alt={recipientName}
                className="w-10 h-10 rounded-xl bg-white/5 object-cover border border-white/10 group-hover:border-white/30 transition-all"
              />
              {isDirect && (
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-black transition-all ${
                    isOtherOnline
                      ? "bg-emerald-400 shadow-[0_0_6px_#34d399]"
                      : "bg-zinc-600"
                  }`}
                />
              )}
            </div>

            {/* User Status Header */}
            <div className="min-w-0 flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-white truncate group-hover:text-emerald-300 transition-colors">
                  {recipientName}
                </h2>
              </div>

              {/* Subtitle: Status */}
              <div className="text-[11px] truncate flex items-center gap-1.5">
                {isRecipientTyping ? (
                  <span className="text-emerald-400 font-medium animate-pulse">typing...</span>
                ) : isDirect ? (
                  isOtherOnline ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Online
                    </span>
                  ) : (
                    <span className="text-zinc-500">Offline</span>
                  )
                ) : (
                  <span className="text-zinc-500">{conversation.members?.length || 0} members</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Audio / Video Call Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => initiateCall(conversation.id, otherMember?.userId, "AUDIO")}
            title="Start Voice Call"
            className="p-2.5 rounded-xl glass-pill hover:bg-white/10 text-zinc-300 hover:text-white transition-all"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            onClick={() => initiateCall(conversation.id, otherMember?.userId, "VIDEO")}
            title="Start Video Call"
            className="p-2.5 rounded-xl glass-pill hover:bg-white/10 text-zinc-300 hover:text-white transition-all"
          >
            <Video className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Message Feed Area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2"
      >
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <LogoLoader variant="stage" label="Retrieving messages..." sublabel="Loading chat history..." />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
            <p className="text-xs">No messages yet. Send a message to start chatting!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isMine={msg.senderId === user?.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      <div className="px-4">
        <TypingIndicator usernames={currentTyping} />
      </div>

      {/* Bottom Message Input Bar with Safe Area Bottom */}
      <div className="p-2.5 sm:p-4 border-t border-white/5 flex-shrink-0 bg-black/60 backdrop-blur-xl pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        <MessageInput
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
        />
      </div>

      {/* User Details Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        isDirect={isDirect}
        user={
          otherMember?.user
            ? {
                id: otherMember.user.id,
                username: otherMember.user.username,
                tag: otherMember.user.tag,
                avatarUrl: otherMember.user.avatarUrl,
                bio: otherMember.user.bio,
                isOnline: isOtherOnline,
              }
            : null
        }
        groupTitle={conversation.title}
        groupDescription={conversation.description}
        groupAvatar={conversation.avatarUrl}
        members={conversation.members}
        onStartCall={(type) => initiateCall(conversation.id, otherMember?.userId, type)}
      />
    </div>
  );
}
