const express = require("express");
const cloudinary = require("../config/cloudinary");
const upload = require("../middleware/upload");
const { requireAuth } = require("../middleware/authMiddleware");
const {
  getUserByUID,
  updateUser,
  toPublicUser,
  toSelfUser,
} = require("../models/userModel");

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

// GET /api/users/me
router.get("/me", requireAuth, async (req, res) => {
  const user = await getUserByUID(req.user.uid);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ user: toSelfUser(user) });
});

// PUT /api/users/me  { username, bio }
router.put("/me", requireAuth, async (req, res) => {
  try {
    const { username, bio } = req.body;
    const fields = {};
    if (typeof username === "string" && username.trim().length >= 2) {
      fields.username = username.trim();
    }
    if (typeof bio === "string") {
      fields.bio = bio.slice(0, 200);
    }
    const updated = await updateUser(req.user.uid, fields);
    res.json({ user: toSelfUser(updated) });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Could not update profile" });
  }
});

// POST /api/users/me/avatar  (multipart form field "avatar")
router.post("/me/avatar", requireAuth, upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    if (!req.file.mimetype.startsWith("image/")) {
      return res.status(400).json({ message: "Avatar must be an image" });
    }

    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: `chat-app/avatars/${req.user.uid}`,
      resource_type: "image",
      transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
    });

    const updated = await updateUser(req.user.uid, { avatarUrl: result.secure_url });
    res.json({ user: toSelfUser(updated) });
  } catch (err) {
    console.error("Avatar upload error:", err);
    res.status(500).json({ message: "Avatar upload failed" });
  }
});

// GET /api/users/search/:uid  -> find a user by their public 6-char UID
router.get("/search/:uid", requireAuth, async (req, res) => {
  try {
    const uid = (req.params.uid || "").trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(uid)) {
      return res.status(400).json({ message: "UID must be exactly 6 alphanumeric characters" });
    }
    if (uid === req.user.uid) {
      return res.status(400).json({ message: "That's your own UID" });
    }

    const user = await getUserByUID(uid);
    if (!user) return res.status(404).json({ message: "No user found with that UID" });

    res.json({ user: toPublicUser(user) });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ message: "Search failed" });
  }
});

// GET /api/users/:uid -> public profile (e.g. to render chat header)
router.get("/:uid", requireAuth, async (req, res) => {
  const user = await getUserByUID(req.params.uid);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ user: toPublicUser(user) });
});

module.exports = router;