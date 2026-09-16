// Firebase Realtime Database keys cannot contain '.', '#', '$', '[', ']', '/'
// so we percent-encode email addresses before using them as keys in /emailIndex.
function encodeEmailKey(email) {
  return encodeURIComponent(email.trim().toLowerCase()).replace(/\./g, "%2E");
}

// Builds a deterministic chat id for a 1-to-1 chat from two UIDs (order independent).
function buildChatId(uidA, uidB) {
  return [uidA, uidB].sort().join("_");
}

module.exports = { encodeEmailKey, buildChatId };
