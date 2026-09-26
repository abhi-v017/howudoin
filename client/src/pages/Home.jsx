import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { getSocket } from "../api/socket";
import { useAuth } from "../context/AuthContext.jsx";
import Avatar from "../components/Avatar.jsx";
import ChatList from "../components/ChatList.jsx";
import ChatWindow from "../components/ChatWindow.jsx";
import SearchUser from "../components/SearchUser.jsx";

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
    <div className="h-screen flex bg-bg overflow-hidden p-2 md:p-4 gap-4">
      {/* Sidebar */}
      <div
        className={`w-full md:w-80 lg:w-96 shrink-0 bg-surface rounded-[2rem] shadow-clay-card flex-col overflow-hidden ${
          showListOnMobile ? "flex" : "hidden md:flex"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 bg-surface z-10 rounded-t-[2rem]">
          <Link to="/profile" className="flex items-center gap-3 min-w-0">
            <Avatar user={user} size={42} />
            <span className="text-lg font-bold text-text truncate">Chats</span>
          </Link>
        </div>

        <div className="px-4 pb-2">
          <SearchUser onStartChat={handleStartChat} />
        </div>

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
      <div
        className={`flex-1 flex-col bg-surface rounded-[2rem] shadow-clay-card overflow-hidden ${
          showListOnMobile ? "hidden md:flex" : "flex"
        }`}
      >
        {activeChat ? (
          <ChatWindow
            chat={activeChat}
            onlineMap={onlineMap}
            onBack={() => setShowListOnMobile(true)}
          />
        ) : (
          <div className="flex-1 hidden md:flex items-center justify-center text-text-muted text-sm bg-surface">
            Select a conversation or search a UID to start chatting
          </div>
        )}
      </div>
    </div>
  );
}
