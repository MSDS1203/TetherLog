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

// unfollow user
router.delete("/:id", authMiddleware, async (req, res) => {
  const db = await getDb();

  const followerId = req.user.id;
  const followingId = req.params.id;

  db.run(
    `DELETE FROM follows 
     WHERE follower_id = ? AND following_id = ?`,
    [followerId, followingId]
  );

  saveDatabase();

  res.json({ message: "Unfollowed user" });
});

// check for follows
router.get("/:id/status", authMiddleware, async (req, res) => {
  const db = await getDb();

  const stmt = db.prepare(`
    SELECT 1 FROM follows
    WHERE follower_id = ? AND following_id = ?
  `);

  stmt.bind([req.user.id, req.params.id]);

  const isFollowing = stmt.step();

  stmt.free();

  res.json({ isFollowing });
});

// following list 
router.get("/following/me", authMiddleware, async (req, res) => {
  const db = await getDb();

  const stmt = db.prepare(`
    SELECT users.id, users.name, users.email
    FROM follows
    JOIN users ON users.id = follows.following_id
    WHERE follows.follower_id = ?
  `);

  stmt.bind([req.user.id]);

  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }

  stmt.free();

  res.json(results);
});

// followers list 
router.get("/followers/me", authMiddleware, async (req, res) => {
  const db = await getDb();

  const stmt = db.prepare(`
    SELECT users.id, users.name, users.email
    FROM follows
    JOIN users ON users.id = follows.follower_id
    WHERE follows.following_id = ?
  `);

  stmt.bind([req.user.id]);

  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }

  stmt.free();

  res.json(results);
});

export default router;