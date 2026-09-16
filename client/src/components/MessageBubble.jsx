import React from "react";

export default function MessageBubble({ message, isMine }) {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-2 px-2`}>
      <div
        className={`max-w-[78%] sm:max-w-[60%] rounded-2xl overflow-hidden shadow-sm ${
          isMine ? "bg-bubbleMe text-bubbleMe-text" : "bg-bubbleThem text-bubbleThem-text"
        } ${message.mediaUrl ? "p-1.5" : "px-3.5 py-2.5"}`}
      >
        {message.mediaType === "image" && message.mediaUrl && (
          <img
            src={message.mediaUrl}
            alt="shared"
            className="rounded-xl max-h-72 w-full object-cover"
            loading="lazy"
          />
        )}
        {message.mediaType === "video" && message.mediaUrl && (
          <video src={message.mediaUrl} controls className="rounded-xl max-h-72 w-full" />
        )}
        {message.text && (
          <p className={`text-sm whitespace-pre-wrap break-words ${message.mediaUrl ? "px-2 pt-1.5" : ""}`}>
            {message.text}
          </p>
        )}
        <p
          className={`text-[10px] mt-1 opacity-70 text-right ${
            message.mediaUrl ? "px-2 pb-1" : ""
          }`}
        >
          {time}
        </p>
      </div>
    </div>
  );
}
