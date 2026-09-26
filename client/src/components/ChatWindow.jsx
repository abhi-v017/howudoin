import React, { useEffect, useRef, useState, useCallback } from "react";
import api from "../api/axios";
import { getSocket } from "../api/socket";
import { useAuth } from "../context/AuthContext.jsx";
import Avatar from "./Avatar.jsx";
import MessageBubble from "./MessageBubble.jsx";

export default function ChatWindow({ chat, onBack, onlineMap, onNewMessage }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeout = useRef(null);

  const partner = chat.partner;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get(`/chats/${chat.chatId}/messages`)
      .then(({ data }) => {
        if (!cancelled) setMessages(data.messages);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [chat.chatId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    function handleNew(message) {
      const belongsHere =
        (message.senderId === partner.uid && message.receiverId === user.uid) ||
        (message.senderId === user.uid && message.receiverId === partner.uid);
      if (belongsHere) {
        setMessages((prev) => [...prev, message]);
      }
      onNewMessage?.(message);
    }

    function handleTypingStart({ senderId }) {
      if (senderId === partner.uid) setPartnerTyping(true);
    }
    function handleTypingStop({ senderId }) {
      if (senderId === partner.uid) setPartnerTyping(false);
    }

    socket.on("message:new", handleNew);
    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);

    return () => {
      socket.off("message:new", handleNew);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
    };
  }, [partner.uid, user.uid, onNewMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, partnerTyping]);

  const emitTyping = useCallback(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit("typing:start", { chatId: chat.chatId, receiverId: partner.uid });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit("typing:stop", { chatId: chat.chatId, receiverId: partner.uid });
    }, 1500);
  }, [chat.chatId, partner.uid]);

  function sendMessage({ text: t = "", mediaUrl = "", mediaType = "" }) {
    const socket = getSocket();
    if (!socket) return;
    socket.emit(
      "message:send",
      { receiverId: partner.uid, text: t, mediaUrl, mediaType },
      (res) => {
        if (!res?.ok) {
          alert(res?.error || "Failed to send message");
        }
      }
    );
  }

  function handleSend(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMessage({ text: trimmed });
    setText("");
  }

  async function handleFilePick(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isVideo && !isImage) {
      alert("Only images and videos are supported");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      alert("File must be under 25MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post("/chats/media", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      sendMessage({ mediaUrl: data.mediaUrl, mediaType: data.mediaType });
    } catch (err) {
      alert(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const isOnline = !!onlineMap?.[partner.uid];

  return (
    <div className="flex flex-col h-full bg-surface rounded-[2rem]">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-5 bg-surface z-10 shadow-clay-card rounded-t-[2rem]">
        <button
          onClick={onBack}
          className="md:hidden w-10 h-10 rounded-full flex items-center justify-center bg-surface shadow-clay-btn text-text hover:shadow-clay-btn-active"
          aria-label="Back"
        >
          ←
        </button>
        <Avatar user={partner} size={44} online={isOnline} />
        <div className="min-w-0">
          <p className="text-base font-bold truncate text-text">{partner.username}</p>
          <p className="text-xs text-text-muted truncate">
            {partnerTyping ? "Typing…" : isOnline ? "Online" : `UID: ${partner.uid}`}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        {loading ? (
          <p className="text-center text-sm text-text-muted mt-8">Loading messages…</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-text-muted mt-8">
            Say hi to {partner.username} 👋
          </p>
        ) : (
          messages.map((m) => (
            <MessageBubble key={m.id} message={m} isMine={m.senderId === user.uid} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="p-4 bg-surface rounded-b-[2rem]">
        <form
          onSubmit={handleSend}
          className="flex items-center gap-3 p-2 rounded-full bg-surface shadow-clay-input"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFilePick}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-text bg-surface shadow-clay-btn hover:shadow-clay-btn-active transition disabled:opacity-50"
            title="Share photo or video"
          >
            {uploading ? "…" : "📎"}
          </button>
          <input
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              emitTyping();
            }}
            placeholder="Type a message..."
            className="flex-1 min-w-0 px-3 py-2 bg-transparent text-text placeholder-text-muted text-sm focus:outline-none"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center bg-primary text-white shadow-clay-btn hover:shadow-clay-btn-active text-sm transition disabled:opacity-50"
          >
            ➤
          </button>
        </form>
      </div>
    </div>
  );
}
