const { db, admin } = require("../config/firebase");
const { buildChatId } = require("../utils/encodeKey");

/**
 * Data layout:
 * chats/{chatId}/participants = { [uidA]: true, [uidB]: true }
 * chats/{chatId}/messages/{messageId} = { id, senderId, receiverId, text, mediaUrl, mediaType, createdAt, status }
 * userChats/{uid}/{chatId} = { chatId, withUid, lastMessage, lastMessageType, lastTimestamp, unread }
 */

async function ensureChat(uidA, uidB) {
  const chatId = buildChatId(uidA, uidB);
  const chatRef = db.ref(`chats/${chatId}/participants`);
  const snap = await chatRef.once("value");
  if (!snap.exists()) {
    await chatRef.set({ [uidA]: true, [uidB]: true });
  }
  return chatId;
}

async function saveMessage({ senderId, receiverId, text = "", mediaUrl = "", mediaType = "" }) {
  const chatId = await ensureChat(senderId, receiverId);
  const msgRef = db.ref(`chats/${chatId}/messages`).push();
  const message = {
    id: msgRef.key,
    senderId,
    receiverId,
    text,
    mediaUrl,
    mediaType, // "image" | "video" | ""
    createdAt: admin.database.ServerValue.TIMESTAMP,
    status: "sent",
  };
  await msgRef.set(message);

  const lastMessage = text || (mediaType === "video" ? "🎥 Video" : mediaType === "image" ? "📷 Photo" : "");
  const timestamp = Date.now();

  const updates = {};
  updates[`userChats/${senderId}/${chatId}`] = {
    chatId,
    withUid: receiverId,
    lastMessage,
    lastMessageType: mediaType || "text",
    lastTimestamp: timestamp,
  };
  updates[`userChats/${receiverId}/${chatId}`] = {
    chatId,
    withUid: senderId,
    lastMessage,
    lastMessageType: mediaType || "text",
    lastTimestamp: timestamp,
  };
  await db.ref().update(updates);

  return { ...message, createdAt: timestamp, chatId };
}

async function getMessages(chatId, limit = 50) {
  const snap = await db
    .ref(`chats/${chatId}/messages`)
    .orderByChild("createdAt")
    .limitToLast(limit)
    .once("value");
  if (!snap.exists()) return [];
  const val = snap.val();
  return Object.values(val).sort((a, b) => a.createdAt - b.createdAt);
}

async function getUserChatList(uid) {
  const snap = await db.ref(`userChats/${uid}`).once("value");
  if (!snap.exists()) return [];
  const val = snap.val();
  return Object.values(val).sort((a, b) => b.lastTimestamp - a.lastTimestamp);
}

async function isParticipant(chatId, uid) {
  const snap = await db.ref(`chats/${chatId}/participants/${uid}`).once("value");
  return snap.exists();
}

module.exports = { ensureChat, saveMessage, getMessages, getUserChatList, isParticipant };
