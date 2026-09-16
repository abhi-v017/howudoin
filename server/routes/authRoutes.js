const express = require("express");
const bcrypt = require("bcryptjs");
const { generateUniqueUID } = require("../utils/generateUID");
const { signToken } = require("../utils/jwt");
const {
  createUser,
  getUserByEmail,
  toSelfUser,
} = require("../models/userModel");

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/register", async (req, res) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ message: "email, password and username are required" });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ message: "Invalid email address" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    if (username.trim().length < 2) {
      return res.status(400).json({ message: "Username must be at least 2 characters" });
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    // The email is only ever used to (a) log in and (b) guarantee one anonymous
    // identity per address. It is never shown to other users — only the
    // randomly generated 6-character UID is public, keeping users anonymous.
    const uid = await generateUniqueUID();
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser({ uid, username: username.trim(), email, passwordHash });

    const token = signToken({ uid: user.uid, username: user.username });
    res.status(201).json({ token, user: toSelfUser(user) });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error during registration" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = signToken({ uid: user.uid, username: user.username });
    res.json({ token, user: toSelfUser(user) });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
});

module.exports = router;
