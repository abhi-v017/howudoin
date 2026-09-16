import React from "react";
import Avatar from "./Avatar.jsx";

function timeAgo(ts) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

export default function ChatList({ chats, activeChatId, onSelect, onlineMap }) {
  if (!chats.length) {
    return (
      <div className="flex-1 flex items-center justify-center text-center text-sm text-text-muted px-6">
        No conversations yet. Search someone by their UID to start chatting.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {chats.map((chat) => {
        const partner = chat.partner || {};
        const isActive = chat.chatId === activeChatId;
        return (
          <button
            key={chat.chatId}
            onClick={() => onSelect(chat)}
            className={`w-full flex items-center gap-3 px-3 py-3 text-left border-b border-border hover:bg-surface-alt transition ${
              isActive ? "bg-surface-alt" : ""
            }`}
          >
            <Avatar user={partner} size={44} online={onlineMap?.[chat.withUid]} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium truncate">{partner.username || "Unknown"}</p>
                <span className="text-[11px] text-text-muted shrink-0">
                  {timeAgo(chat.lastTimestamp)}
                </span>
              </div>
              <p className="text-xs text-text-muted truncate">{chat.lastMessage}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
