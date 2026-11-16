"use client";

import React, { useState, useRef } from "react";
import { Paperclip, Send, Loader2, X, Mic } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface MessageInputProps {
  onSendMessage: (data: {
    content?: string;
    type?: string;
    mediaUrl?: string;
    mediaName?: string;
    mediaSize?: number;
    mediaMimeType?: string;
  }) => Promise<void>;
  onTyping: (isTyping: boolean) => void;
}

export function MessageInput({ onSendMessage, onTyping }: MessageInputProps) {
  const { token } = useAuth();
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    onTyping(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 1500);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        alert("File size exceeds 25MB limit.");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!text.trim() && !selectedFile) || isSending || isUploading) return;

    setIsSending(true);
    onTyping(false);

    try {
      if (selectedFile && token) {
        setIsUploading(true);
        const uploadRes = await api.media.upload(selectedFile, token);
        const media = uploadRes.data;

        await onSendMessage({
          content: text.trim() || undefined,
          type: media.type,
          mediaUrl: media.mediaUrl,
          mediaName: media.originalName,
          mediaSize: media.size,
          mediaMimeType: media.mimeType,
        });

        setSelectedFile(null);
        setIsUploading(false);
      } else if (text.trim()) {
        await onSendMessage({
          content: text.trim(),
          type: "TEXT",
        });
      }

      setText("");
    } catch (err: any) {
      alert(err.message || "Failed to send message");
    } finally {
      setIsSending(false);
      setIsUploading(false);
    }
  };

  return (
    <div className="relative">
      {/* File Attachment Capsule Preview */}
      {selectedFile && (
        <div className="mb-2 p-2 px-3 rounded-xl glass-panel inline-flex items-center gap-2 text-xs border border-white/10 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <Paperclip className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-white font-medium max-w-[200px] truncate">{selectedFile.name}</span>
          <span className="text-zinc-500">({(selectedFile.size / 1024).toFixed(0)} KB)</span>
          <button
            onClick={() => setSelectedFile(null)}
            className="p-1 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Capsule Bar */}
      <form
        onSubmit={handleSubmit}
        className="glass-panel p-2 pl-3 rounded-full flex items-center gap-2 border border-white/10 shadow-glass focus-within:border-white/20 transition-all"
      >
        {/* Attachment Button */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Attach file"
          className="p-2.5 rounded-full glass-pill hover:bg-white/10 text-zinc-400 hover:text-white transition-all flex-shrink-0"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        {/* Input Text Field */}
        <input
          type="text"
          value={text}
          onChange={handleTextChange}
          placeholder="Type a message..."
          className="flex-1 bg-transparent border-none text-white text-base sm:text-sm placeholder-zinc-500 focus:outline-none px-2 min-w-0"
        />

        {/* Send Action */}
        <button
          type="submit"
          disabled={(!text.trim() && !selectedFile) || isSending || isUploading}
          className="p-3 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 disabled:opacity-30 disabled:scale-95 shadow-md"
          style={{
            backgroundColor: "var(--accent-color)",
            color: "var(--accent-text)",
          }}
        >
          {isSending || isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
}
