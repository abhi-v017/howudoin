"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { useSocket } from "./SocketContext";
import { useAuth } from "./AuthContext";
import { ActiveCall, CallType, CallStatus } from "@/types";

interface CallContextType {
  activeCall: ActiveCall | null;
  callStatus: CallStatus;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  initiateCall: (conversationId: string, receiverId: string | undefined, callType: CallType) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

export function CallProvider({ children }: { children: React.ReactNode }) {
  const { socket } = useSocket();
  const { user } = useAuth();

  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus>("IDLE");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Setup WebRTC socket listeners
  useEffect(() => {
    if (!socket || !user) return;

    // Incoming Call Notification
    socket.on("call:incoming", (data: any) => {
      setActiveCall({
        callId: data.callId,
        conversationId: data.conversationId,
        callType: data.callType,
        caller: data.caller,
        isIncoming: true,
      });
      setCallStatus("RINGING");
    });

    // Call Accepted by peer
    socket.on("call:accepted", async (data: any) => {
      setCallStatus("ONGOING");
      // Create and send SDP Offer if we are the caller
      if (peerConnectionRef.current) {
        try {
          const offer = await peerConnectionRef.current.createOffer();
          await peerConnectionRef.current.setLocalDescription(offer);
          socket.emit("call:signal", {
            targetUserId: data.acceptedBy.id,
            signal: offer,
            callId: data.callId,
          });
        } catch (e) {
          console.error("Error creating offer:", e);
        }
      }
    });

    // Call Rejected
    socket.on("call:rejected", () => {
      cleanupCall();
      setCallStatus("ENDED");
      setTimeout(() => setCallStatus("IDLE"), 2000);
    });

    // Signaling Data (Offer, Answer, ICE Candidate)
    socket.on("call:signal", async (data: { senderId: string; signal: any; callId?: string }) => {
      const pc = peerConnectionRef.current;
      if (!pc) return;

      const { signal, senderId } = data;

      try {
        if (signal.type === "offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("call:signal", {
            targetUserId: senderId,
            signal: answer,
            callId: data.callId,
          });
        } else if (signal.type === "answer") {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
        } else if (signal.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(signal));
        }
      } catch (err) {
        console.error("Error handling signal:", err);
      }
    });

    // Call Ended
    socket.on("call:ended", () => {
      cleanupCall();
      setCallStatus("ENDED");
      setTimeout(() => setCallStatus("IDLE"), 2000);
    });

    return () => {
      socket.off("call:incoming");
      socket.off("call:accepted");
      socket.off("call:rejected");
      socket.off("call:signal");
      socket.off("call:ended");
    };
  }, [socket, user]);

  const setupPeerConnection = (targetUserId?: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Relay local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle incoming remote media
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    // Forward ICE candidates to peer
    pc.onicecandidate = (event) => {
      if (event.candidate && socket && targetUserId) {
        socket.emit("call:signal", {
          targetUserId,
          signal: event.candidate,
        });
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  const initiateCall = async (conversationId: string, receiverId: string | undefined, callType: CallType) => {
    if (!socket || !user) return;

    try {
      setCallStatus("CALLING");

      // Acquire mic / camera stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === "VIDEO",
      });

      localStreamRef.current = stream;
      setLocalStream(stream);

      setupPeerConnection(receiverId);

      socket.emit(
        "call:initiate",
        { conversationId, receiverId, callType },
        (res: { success: boolean; callId: string }) => {
          if (res?.success) {
            setActiveCall({
              callId: res.callId,
              conversationId,
              callType,
              caller: { id: user.id, username: user.username },
              receiverId,
              isIncoming: false,
            });
          }
        }
      );
    } catch (err) {
      console.error("Camera/Mic access denied:", err);
      cleanupCall();
      setCallStatus("IDLE");
    }
  };

  const acceptCall = async () => {
    if (!activeCall || !socket) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: activeCall.callType === "VIDEO",
      });

      localStreamRef.current = stream;
      setLocalStream(stream);

      setupPeerConnection(activeCall.caller.id);

      socket.emit("call:accept", {
        callId: activeCall.callId,
        callerId: activeCall.caller.id,
      });

      setCallStatus("ONGOING");
    } catch (err) {
      console.error("Error accepting call:", err);
      rejectCall();
    }
  };

  const rejectCall = () => {
    if (activeCall && socket) {
      socket.emit("call:reject", {
        callId: activeCall.callId,
        callerId: activeCall.caller.id,
      });
    }
    cleanupCall();
    setCallStatus("IDLE");
  };

  const endCall = () => {
    if (socket && activeCall) {
      socket.emit("call:end", {
        callId: activeCall.callId,
        conversationId: activeCall.conversationId,
        targetUserId: activeCall.isIncoming ? activeCall.caller.id : activeCall.receiverId,
      });
    }
    cleanupCall();
    setCallStatus("ENDED");
    setTimeout(() => setCallStatus("IDLE"), 1500);
  };

  const cleanupCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setActiveCall(null);
    setIsMuted(false);
    setIsVideoOff(false);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  return (
    <CallContext.Provider
      value={{
        activeCall,
        callStatus,
        localStream,
        remoteStream,
        isMuted,
        isVideoOff,
        initiateCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleVideo,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error("useCall must be used within a CallProvider");
  }
  return context;
}
