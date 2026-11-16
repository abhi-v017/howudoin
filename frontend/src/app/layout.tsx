import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import { CallProvider } from "@/context/CallContext";
import { IncomingCallBanner } from "@/components/webrtc/IncomingCallBanner";
import { CallOverlay } from "@/components/webrtc/CallOverlay";

export const metadata: Metadata = {
  title: "howudoin | Private Messaging",
  description: "Private messaging, voice and video calls.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "howudoin",
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full" style={{ backgroundColor: "#000000", color: "#ffffff" }}>
      <body
        className="bg-black text-white antialiased h-full h-[100dvh] overflow-hidden selection:bg-white/20 selection:text-white"
        style={{ backgroundColor: "#000000", color: "#ffffff" }}
      >
        <AuthProvider>
          <SocketProvider>
            <CallProvider>
              {/* WebRTC Realtime Notifications & Call Screen */}
              <IncomingCallBanner />
              <CallOverlay />

              {/* Main Content */}
              <div className="relative z-10 h-full h-[100dvh] flex flex-col overflow-hidden">
                {children}
              </div>
            </CallProvider>
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
