const { verifyToken } = require("../utils/jwt");
const { saveMessage, isParticipant } = require("../models/messageModel");
const { buildChatId } = require("../utils/encodeKey");

// uid -> Set of socket ids (a user can have multiple tabs/devices open)
const onlineUsers = new Map();

function addOnline(uid, socketId) {
  if (!onlineUsers.has(uid)) onlineUsers.set(uid, new Set());
  onlineUsers.get(uid).add(socketId);
}

function removeOnline(uid, socketId) {
  const set = onlineUsers.get(uid);
  if (!set) return;
  set.delete(socketId);
  if (set.size === 0) onlineUsers.delete(uid);
}

function isOnline(uid) {
  return onlineUsers.has(uid);
}

function initChatSocket(io) {
  // Authenticate every socket connection using the same JWT used for REST calls
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No auth token"));
      const decoded = verifyToken(token);
      socket.user = decoded; // { uid, username }
      next();
    } catch (err) {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const { uid } = socket.user;
    addOnline(uid, socket.id);
    socket.join(uid); // personal room, one per user, all their devices join it

    io.emit("presence:update", { uid, online: true });

    socket.on("message:send", async (payload, ack) => {
      try {
        const { receiverId, text = "", mediaUrl = "", mediaType = "" } = payload || {};
        if (!receiverId) throw new Error("receiverId is required");
        if (!text.trim() && !mediaUrl) throw new Error("Message is empty");

        const message = await saveMessage({
          senderId: uid,
          receiverId,
          text: text.trim(),
          mediaUrl,
          mediaType,
        });

        // deliver to both participants' personal rooms (covers multi-device sync)
        io.to(receiverId).to(uid).emit("message:new", message);

        if (typeof ack === "function") ack({ ok: true, message });
      } catch (err) {
        if (typeof ack === "function") ack({ ok: false, error: err.message });
      }
    });

    socket.on("typing:start", ({ chatId, receiverId }) => {
      if (receiverId) socket.to(receiverId).emit("typing:start", { chatId, senderId: uid });
    });

    socket.on("typing:stop", ({ chatId, receiverId }) => {
      if (receiverId) socket.to(receiverId).emit("typing:stop", { chatId, senderId: uid });
    });

    socket.on("presence:check", ({ uid: targetUid }, ack) => {
      if (typeof ack === "function") ack({ uid: targetUid, online: isOnline(targetUid) });
    });

    socket.on("disconnect", () => {
      removeOnline(uid, socket.id);
      if (!isOnline(uid)) {
        io.emit("presence:update", { uid, online: false });
      }
    });
  });
}

module.exports = { initChatSocket, isOnline, buildChatId };
