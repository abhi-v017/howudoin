import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import { CallProvider } from "@/context/CallContext";
import { IncomingCallBanner } from "@/components/webrtc/IncomingCallBanner";
import { CallOverlay } from "@/components/webrtc/CallOverlay";

export const metadata: Metadata = {
  title: "howudoin | Anonymous Realtime Chat",
  description: "Private, anonymous realtime chat with WebSockets, WebRTC voice/video, and media sharing.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" style={{ backgroundColor: "#000000", color: "#ffffff" }}>
      <body
        className="bg-black text-white antialiased min-h-screen selection:bg-white/20 selection:text-white"
        style={{ backgroundColor: "#000000", color: "#ffffff" }}
      >
        <AuthProvider>
          <SocketProvider>
            <CallProvider>
              {/* Global Ambient Glow */}
              <div className="ambient-glow" />

              {/* WebRTC Realtime Notifications & Call Screen */}
              <IncomingCallBanner />
              <CallOverlay />

              {/* Main Content */}
              <div className="relative z-10 min-h-screen flex flex-col">
                {children}
              </div>
            </CallProvider>
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
