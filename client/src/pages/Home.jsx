import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { getSocket } from "../api/socket";
import { useAuth } from "../context/AuthContext.jsx";
import Avatar from "../components/Avatar.jsx";
import ChatList from "../components/ChatList.jsx";
import ChatWindow from "../components/ChatWindow.jsx";
import SearchUser from "../components/SearchUser.jsx";
import ThemeSwitcher from "../components/ThemeSwitcher.jsx";

export default function Home() {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [onlineMap, setOnlineMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [showListOnMobile, setShowListOnMobile] = useState(true);

  const loadChats = useCallback(async () => {
    const { data } = await api.get("/chats");
    setChats(data.chats);
    return data.chats;
  }, []);

  useEffect(() => {
    loadChats().finally(() => setLoading(false));
  }, [loadChats]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    function bumpChat(message) {
      const partnerUid = message.senderId === user.uid ? message.receiverId : message.senderId;
      setChats((prev) => {
        const idx = prev.findIndex((c) => c.withUid === partnerUid);
        const preview =
          message.text || (message.mediaType === "video" ? "🎥 Video" : message.mediaType === "image" ? "📷 Photo" : "");
        if (idx === -1) {
          // brand new conversation not yet in the list — refetch to get partner profile
          loadChats();
          return prev;
        }
        const updated = {
          ...prev[idx],
          lastMessage: preview,
          lastTimestamp: message.createdAt,
        };
        const rest = prev.filter((_, i) => i !== idx);
        return [updated, ...rest];
      });
    }

    function handlePresence({ uid, online }) {
      setOnlineMap((prev) => ({ ...prev, [uid]: online }));
    }

    socket.on("message:new", bumpChat);
    socket.on("presence:update", handlePresence);

    return () => {
      socket.off("message:new", bumpChat);
      socket.off("presence:update", handlePresence);
    };
  }, [user.uid, loadChats]);

  async function handleStartChat(otherUser) {
    const { data } = await api.post("/chats/start", { uid: otherUser.uid });
    const chatEntry = {
      chatId: data.chatId,
      withUid: otherUser.uid,
      partner: data.partner,
      lastMessage: "",
      lastTimestamp: Date.now(),
    };
    setChats((prev) => {
      const exists = prev.find((c) => c.chatId === data.chatId);
      return exists ? prev : [chatEntry, ...prev];
    });
    setActiveChat(chatEntry);
    setShowListOnMobile(false);
  }

  function handleSelect(chat) {
    setActiveChat(chat);
    setShowListOnMobile(false);
  }

  return (
    <div className="h-screen flex bg-bg overflow-hidden">
      {/* Sidebar */}
      <div
        className={`w-full md:w-80 lg:w-96 shrink-0 border-r border-border bg-surface flex-col ${
          showListOnMobile ? "flex" : "hidden md:flex"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <Link to="/profile" className="flex items-center gap-2 min-w-0">
            <Avatar user={user} size={36} />
            <span className="text-sm font-semibold truncate">{user.username}</span>
          </Link>
          <ThemeSwitcher />
        </div>

        <SearchUser onStartChat={handleStartChat} />

        {loading ? (
          <p className="text-center text-sm text-text-muted mt-8">Loading chats…</p>
        ) : (
          <ChatList
            chats={chats}
            activeChatId={activeChat?.chatId}
            onSelect={handleSelect}
            onlineMap={onlineMap}
          />
        )}
      </div>

      {/* Chat window */}
      <div className={`flex-1 flex-col ${showListOnMobile ? "hidden md:flex" : "flex"}`}>
        {activeChat ? (
          <ChatWindow
            chat={activeChat}
            onlineMap={onlineMap}
            onBack={() => setShowListOnMobile(true)}
          />
        ) : (
          <div className="flex-1 hidden md:flex items-center justify-center text-text-muted text-sm">
            Select a conversation or search a UID to start chatting
          </div>
        )}
      </div>
    </div>
  );
}
