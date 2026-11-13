"use client";

import React from "react";
import { useCall } from "@/context/CallContext";
import { Phone, PhoneOff, Video } from "lucide-react";

export function IncomingCallBanner() {
  const { activeCall, callStatus, acceptCall, rejectCall } = useCall();

  if (callStatus !== "RINGING" || !activeCall?.isIncoming) return null;

  const isVideo = activeCall.callType === "VIDEO";

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="glass-panel p-4 px-6 rounded-3xl border border-emerald-500/30 shadow-2xl flex items-center gap-6 bg-black/85 backdrop-blur-2xl">
        {/* Ringing Visual */}
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            {isVideo ? <Video className="w-6 h-6 animate-pulse" /> : <Phone className="w-6 h-6 animate-bounce" />}
          </div>
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 animate-ping" />
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            Incoming {isVideo ? "Video" : "Voice"} Call
          </span>
          <span className="text-base font-bold text-white">
            {activeCall.caller.username}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={acceptCall}
            title="Accept Call"
            className="p-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold transition-all shadow-lg shadow-emerald-500/20"
          >
            <Phone className="w-5 h-5" />
          </button>
          <button
            onClick={rejectCall}
            title="Decline Call"
            className="p-3.5 rounded-2xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 transition-all"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
