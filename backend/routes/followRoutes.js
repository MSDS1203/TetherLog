import express from "express";
import { getDb, generateId, saveDatabase } from "../database.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// allows user to follow another user
router.post("/:id", authMiddleware, async (req, res) => {
  const db = await getDb();

  const followerId = req.user.id;
  const followingId = req.params.id;

  if (followerId === followingId) {
    return res.status(400).json({ error: "Cannot follow yourself" });
  }

  try {
    db.run(
      `
      INSERT INTO follows (id, follower_id, following_id)
      VALUES (?, ?, ?)
      `,
      [generateId(), followerId, followingId]
    );

    saveDatabase();
    res.json({ message: "Followed user" });

  } catch (err) {
    if (err.message.includes("UNIQUE")) {
      return res.status(409).json({ error: "Already following" });
    }
    res.status(500).json({ error: err.message });
  }
});

export default router;