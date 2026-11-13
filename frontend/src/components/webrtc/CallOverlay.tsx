"use client";

import React, { useEffect, useRef } from "react";
import { useCall } from "@/context/CallContext";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Minimize2 } from "lucide-react";
import { LogoLoader } from "@/components/ui/LogoLoader";

export function CallOverlay() {
  const {
    activeCall,
    callStatus,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    endCall,
    toggleMute,
    toggleVideo,
  } = useCall();

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  // Attach local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (callStatus === "IDLE" || callStatus === "RINGING") return null;

  const isVideoCall = activeCall?.callType === "VIDEO";

  return (
    <div className="fixed inset-x-4 bottom-4 md:inset-auto md:right-8 md:bottom-8 z-50 animate-in fade-in zoom-in-95 duration-200">
      <div className="w-full md:w-96 glass-panel p-4 rounded-3xl border border-white/15 shadow-2xl bg-black/90 backdrop-blur-2xl overflow-hidden flex flex-col gap-3">
        {/* Top Header */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-semibold text-white tracking-wide">
              {callStatus === "CALLING" ? "Calling..." : "Call Connected"}
            </span>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">
            {activeCall?.caller.username}
          </span>
        </div>

        {/* Video or Voice Canvas */}
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-zinc-950/80 border border-white/5 flex items-center justify-center">
          {isVideoCall && remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            // Voice Wave & Logo Stage
            <div className="flex flex-col items-center justify-center w-full h-full p-2">
              <LogoLoader
                variant="call"
                size={42}
                label="P2P Encrypted Voice"
                sublabel="Secure peer-to-peer audio tunnel"
              />
            </div>
          )}

          {/* Local Camera Picture-in-Picture (for video calls) */}
          {isVideoCall && localStream && (
            <div className="absolute bottom-2 right-2 w-24 h-16 rounded-xl overflow-hidden border border-white/20 shadow-lg bg-black">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror"
              />
            </div>
          )}
        </div>

        {/* Call Action Bar */}
        <div className="flex items-center justify-center gap-3 pt-1">
          {/* Mute Mic */}
          <button
            onClick={toggleMute}
            title={isMuted ? "Unmute" : "Mute"}
            className={`p-3 rounded-2xl glass-pill transition-all ${
              isMuted ? "bg-red-500/20 text-red-400 border-red-500/30" : "text-white hover:bg-white/10"
            }`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Video Toggle (if video call) */}
          {isVideoCall && (
            <button
              onClick={toggleVideo}
              title={isVideoOff ? "Turn Video On" : "Turn Video Off"}
              className={`p-3 rounded-2xl glass-pill transition-all ${
                isVideoOff ? "bg-red-500/20 text-red-400 border-red-500/30" : "text-white hover:bg-white/10"
              }`}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
          )}

          {/* End Call */}
          <button
            onClick={endCall}
            title="End Call"
            className="p-3 px-5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-semibold transition-all shadow-lg shadow-red-600/30 flex items-center gap-1.5 text-xs"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Hang Up</span>
          </button>
        </div>
      </div>
    </div>
  );
}
