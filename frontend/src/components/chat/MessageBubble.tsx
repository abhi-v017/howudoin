"use client";

import React, { useState } from "react";
import { Message } from "@/types";
import { formatTime, resolveMediaUrl } from "@/lib/utils";
import { FileText, Download, Play, Pause, CheckCheck } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
}

export function MessageBubble({ message, isMine }: MessageBubbleProps) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  return (
    <div className={`flex flex-col mb-1.5 ${isMine ? "items-end" : "items-start"}`}>
      {/* Sender Header for Group Incoming Messages */}
      {!isMine && message.sender && (
        <span className="text-[10px] font-semibold text-zinc-400 mb-0.5 px-2">
          {message.sender.username}
        </span>
      )}

      {/* Bubble Container */}
      <div
        className={`relative max-w-[85%] sm:max-w-[70%] md:max-w-[60%] rounded-2xl p-2.5 px-3.5 text-sm leading-relaxed border transition-all ${
          isMine
            ? "rounded-tr-xs border-white/20 text-white"
            : "rounded-tl-xs border-white/10 text-zinc-100 bg-zinc-900/50"
        }`}
        style={{
          background: isMine
            ? "linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.05) 100%)"
            : "rgba(18, 18, 24, 0.65)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Text Content */}
        {message.content && (
          <p className="whitespace-pre-wrap break-words text-[13.5px] leading-snug">
            {message.content}
          </p>
        )}

        {/* Media Renderers */}
        {message.mediaUrl && (() => {
          const mediaSrc = resolveMediaUrl(message.mediaUrl);
          return (
            <div className="mt-1.5">
              {message.type === "IMAGE" && (
                <img
                  src={mediaSrc}
                  alt={message.mediaName || "Image"}
                  className="max-h-72 w-auto rounded-xl object-cover border border-white/10 cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={() => window.open(mediaSrc, "_blank")}
                />
              )}

              {message.type === "VIDEO" && (
                <video
                  src={mediaSrc}
                  controls
                  className="max-h-72 w-full rounded-xl border border-white/10"
                />
              )}

              {message.type === "AUDIO" && (
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.04] border border-white/10 min-w-[200px]">
                  <button
                    onClick={toggleAudio}
                    className="p-2 rounded-full glass-pill hover:bg-white/10 text-white flex-shrink-0"
                  >
                    {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                  </button>
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="flex items-center gap-1 h-4">
                      {[35, 65, 25, 90, 55, 100, 45, 75, 40, 60].map((height, i) => (
                        <span
                          key={i}
                          className={`w-0.5 rounded-full transition-all ${
                            isPlayingAudio ? "bg-white animate-wave" : "bg-zinc-500"
                          }`}
                          style={{
                            height: `${height}%`,
                            animationDelay: `${i * 0.1}s`,
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-[9px] text-zinc-400 mt-0.5">Voice Note</span>
                  </div>
                  <audio
                    ref={audioRef}
                    src={mediaSrc}
                    onEnded={() => setIsPlayingAudio(false)}
                    className="hidden"
                  />
                </div>
              )}

              {message.type === "DOCUMENT" && (
                <a
                  href={mediaSrc}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-white transition-all text-xs"
                >
                  <FileText className="w-4 h-4 flex-shrink-0 text-zinc-400" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate text-xs">{message.mediaName || "Document"}</p>
                    {message.mediaSize && (
                      <span className="text-[10px] text-zinc-500">
                        {(message.mediaSize / 1024).toFixed(0)} KB
                      </span>
                    )}
                  </div>
                  <Download className="w-3.5 h-3.5 flex-shrink-0 text-zinc-400" />
                </a>
              )}
            </div>
          );
        })()}

        {/* Inline WhatsApp-style Time & Read Ticks */}
        <div className="flex items-center justify-end gap-1 mt-1 -mb-0.5">
          <span className="text-[10px] text-zinc-400 font-mono tracking-tight leading-none">
            {formatTime(message.createdAt)}
          </span>
          {isMine && (
            <CheckCheck className="w-3 h-3 text-emerald-400/80 leading-none" />
          )}
        </div>
      </div>
    </div>
  );
}
