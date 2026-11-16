"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { Message } from "@/types";

interface TypingEvent {
  conversationId: string;
  userId: string;
  username: string;
  isTyping: boolean;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUserIds: Set<string>;
  typingUsers: Record<string, string[]>; // conversationId -> array of usernames typing
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  sendSocketMessage: (data: {
    conversationId: string;
    content?: string;
    type?: string;
    mediaUrl?: string;
    mediaName?: string;
    mediaSize?: number;
    mediaMimeType?: string;
    replyToId?: string;
  }) => Promise<Message>;
  emitTyping: (conversationId: string, isTyping: boolean) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const s = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    s.on("connect", () => {
      setIsConnected(true);
    });

    s.on("disconnect", () => {
      setIsConnected(false);
    });

    s.on("presence:update", (data: { userId: string; isOnline: boolean }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        if (data.isOnline) {
          next.add(data.userId);
        } else {
          next.delete(data.userId);
        }
        return next;
      });
    });

    s.on("typing:status", (data: TypingEvent) => {
      if (data.userId === user.id) return;

      setTypingUsers((prev) => {
        const currentList = prev[data.conversationId] || [];
        if (data.isTyping) {
          if (!currentList.includes(data.username)) {
            return { ...prev, [data.conversationId]: [...currentList, data.username] };
          }
        } else {
          return {
            ...prev,
            [data.conversationId]: currentList.filter((name) => name !== data.username),
          };
        }
        return prev;
      });
    });

    socketRef.current = s;
    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [token, user?.id]);

  const joinConversation = (conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("conversation:join", conversationId);
    }
  };

  const leaveConversation = (conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("conversation:leave", conversationId);
    }
  };

  const sendSocketMessage = (data: {
    conversationId: string;
    content?: string;
    type?: string;
    mediaUrl?: string;
    mediaName?: string;
    mediaSize?: number;
    mediaMimeType?: string;
    replyToId?: string;
  }): Promise<Message> => {
    return new Promise((resolve, reject) => {
      if (!socketRef.current?.connected) {
        return reject(new Error("Socket not connected"));
      }

      socketRef.current.emit("message:send", data, (res: { success: boolean; message: Message; error?: string }) => {
        if (res.success && res.message) {
          resolve(res.message);
        } else {
          reject(new Error(res.error || "Failed to send message"));
        }
      });
    });
  };

  const emitTyping = (conversationId: string, isTyping: boolean) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(isTyping ? "typing:start" : "typing:stop", { conversationId });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUserIds,
        typingUsers,
        joinConversation,
        leaveConversation,
        sendSocketMessage,
        emitTyping,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}
