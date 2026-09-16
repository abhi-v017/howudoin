const { db } = require("../config/firebase");
const { encodeEmailKey } = require("../utils/encodeKey");

// users/{uid} = { uid, username, email, passwordHash, bio, avatarUrl, createdAt }
// emailIndex/{encodedEmail} = uid   -> lets us look up a user by email at login

async function createUser({ uid, username, email, passwordHash }) {
  const now = Date.now();
  const user = {
    uid,
    username,
    email: email.trim().toLowerCase(),
    passwordHash,
    bio: "",
    avatarUrl: "",
    createdAt: now,
  };

  const updates = {};
  updates[`users/${uid}`] = user;
  updates[`emailIndex/${encodeEmailKey(email)}`] = uid;

  await db.ref().update(updates);
  return user;
}

async function getUserByUID(uid) {
  const snap = await db.ref(`users/${uid}`).once("value");
  return snap.exists() ? snap.val() : null;
}

async function getUserByEmail(email) {
  const idxSnap = await db.ref(`emailIndex/${encodeEmailKey(email)}`).once("value");
  if (!idxSnap.exists()) return null;
  const uid = idxSnap.val();
  return getUserByUID(uid);
}

async function updateUser(uid, fields) {
  await db.ref(`users/${uid}`).update(fields);
  return getUserByUID(uid);
}

function toPublicUser(user) {
  if (!user) return null;
  const { passwordHash, email, ...rest } = user;
  return rest; // never send passwordHash or email to other users
}

function toSelfUser(user) {
  if (!user) return null;
  const { passwordHash, ...rest } = user;
  return rest; // owner can see their own email, just not the hash
}

module.exports = {
  createUser,
  getUserByUID,
  getUserByEmail,
  updateUser,
  toPublicUser,
  toSelfUser,
};
