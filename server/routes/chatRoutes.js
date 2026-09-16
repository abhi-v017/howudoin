const express = require("express");
const cloudinary = require("../config/cloudinary");
const upload = require("../middleware/upload");
const { requireAuth } = require("../middleware/authMiddleware");
const {
  getMessages,
  getUserChatList,
  isParticipant,
  ensureChat,
} = require("../models/messageModel");
const { getUserByUID, toPublicUser } = require("../models/userModel");

const router = express.Router();

function uploadBufferToCloudinary(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    stream.end(buffer);
  });
}

// GET /api/chats -> list of this user's conversations, newest first, with partner profile attached
router.get("/", requireAuth, async (req, res) => {
  try {
    const list = await getUserChatList(req.user.uid);
    const withProfiles = await Promise.all(
      list.map(async (chat) => {
        const partner = await getUserByUID(chat.withUid);
        return { ...chat, partner: toPublicUser(partner) };
      })
    );
    res.json({ chats: withProfiles });
  } catch (err) {
    console.error("List chats error:", err);
    res.status(500).json({ message: "Could not load chats" });
  }
});

// POST /api/chats/start  { uid } -> ensures a chat thread exists with that user, returns chatId
router.post("/start", requireAuth, async (req, res) => {
  try {
    const { uid } = req.body;
    if (!uid) return res.status(400).json({ message: "uid is required" });
    const partner = await getUserByUID(uid);
    if (!partner) return res.status(404).json({ message: "User not found" });

    const chatId = await ensureChat(req.user.uid, uid);
    res.json({ chatId, partner: toPublicUser(partner) });
  } catch (err) {
    console.error("Start chat error:", err);
    res.status(500).json({ message: "Could not start chat" });
  }
});

// GET /api/chats/:chatId/messages -> message history (must be a participant)
router.get("/:chatId/messages", requireAuth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const allowed = await isParticipant(chatId, req.user.uid);
    if (!allowed) return res.status(403).json({ message: "Not part of this chat" });

    const messages = await getMessages(chatId);
    res.json({ messages });
  } catch (err) {
    console.error("Get messages error:", err);
    res.status(500).json({ message: "Could not load messages" });
  }
});

// POST /api/chats/media  (multipart field "file") -> uploads a chat image/video to Cloudinary
// and returns the URL; the actual message is then sent over the socket connection.
router.post("/media", requireAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const isVideo = req.file.mimetype.startsWith("video/");
    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: `chat-app/messages/${req.user.uid}`,
      resource_type: isVideo ? "video" : "image",
    });

    res.json({
      mediaUrl: result.secure_url,
      mediaType: isVideo ? "video" : "image",
    });
  } catch (err) {
    console.error("Media upload error:", err);
    res.status(500).json({ message: "Media upload failed" });
  }
});

module.exports = router;
