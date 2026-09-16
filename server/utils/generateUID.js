const { db } = require("../config/firebase");

// Uppercase letters + digits only — keeps generated UIDs consistent with the
// case-insensitive-by-convention search (client always uppercases input, and
// the server only accepts uppercase), so there's no A vs a mismatch.
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function randomUID(length = 6) {
  let uid = "";
  for (let i = 0; i < length; i++) {
    uid += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return uid;
}

/**
 * Generates a random 6-character alphanumeric UID (A-Z, a-z, 0-9)
 * and guarantees it is not already taken in /users.
 */
async function generateUniqueUID() {
  let uid;
  let exists = true;
  let attempts = 0;

  while (exists) {
    uid = randomUID(6);
    const snapshot = await db.ref(`users/${uid}`).once("value");
    exists = snapshot.exists();
    attempts++;
    if (attempts > 25) {
      throw new Error("Could not generate a unique UID, please try again.");
    }
  }

  return uid;
}

module.exports = { generateUniqueUID, randomUID };