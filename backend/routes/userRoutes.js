import express from "express";
import { getDb } from "../database.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Search users
router.get("/search", async (req, res) => {
  const db = await getDb();
  const q = req.query.q;

  if (!q) {
    return res.status(400).json({ error: "Missing query" });
  }

  const stmt = db.prepare(`
    SELECT id, name, email
    FROM users
    WHERE name LIKE ? OR email LIKE ?
  `);

  stmt.bind([`%${q}%`, `%${q}%`]);

  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }

  stmt.free();

  res.json(results);
});


// Get user profile 
router.get("/:id", async (req, res) => {
  const db = await getDb();

  const stmt = db.prepare(`
    SELECT id, name, email, bio, avatar_url
    FROM users
    WHERE id = ?
  `);

  stmt.bind([req.params.id]);

  if (stmt.step()) {
    res.json(stmt.getAsObject());
  } else {
    res.status(404).json({ error: "User not found" });
  }

  stmt.free();
});

router.get("/:id/profile", async (req, res) => {
  const db = await getDb();
  const userId = req.params.id;

  try {
    const userStmt = db.prepare(`
      SELECT id, name, email, bio, avatar_url
      FROM users
      WHERE id = ?
    `);
    userStmt.bind([userId]);

    if (!userStmt.step()) {
      userStmt.free();
      return res.status(404).json({ error: "User not found" });
    }

    const user = userStmt.getAsObject();
    userStmt.free();

    const followersStmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM follows
      WHERE following_id = ?
    `);
    followersStmt.bind([userId]);
    followersStmt.step();
    const followersCount = followersStmt.getAsObject().count;
    followersStmt.free();

    const followingStmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM follows
      WHERE follower_id = ?
    `);
    followingStmt.bind([userId]);
    followingStmt.step();
    const followingCount = followingStmt.getAsObject().count;
    followingStmt.free();

    const booksStmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM reading_status
      WHERE user_id = ?
    `);
    booksStmt.bind([userId]);
    booksStmt.step();
    const booksCount = booksStmt.getAsObject().count;
    booksStmt.free();

    const activityStmt = db.prepare(`
      SELECT 
        ru.id,
        ru.page_reached,
        ru.note,
        ru.created_at,
        b.title as book_title
      FROM reading_updates ru
      JOIN books b ON ru.book_id = b.id
      WHERE ru.user_id = ?
      ORDER BY ru.created_at DESC
      LIMIT 10
    `);

    activityStmt.bind([userId]);

    const activity = [];
    while (activityStmt.step()) {
      activity.push(activityStmt.getAsObject());
    }
    activityStmt.free();

    res.json({
      user,
      stats: {
        followers: followersCount,
        following: followingCount,
        booksSaved: booksCount
      },
      activity
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load profile" });
  }
});

router.get("/:id/feed", async (req, res) => {
  const db = await getDb();

  try {
    const stmt = db.prepare(`
      SELECT 
        ru.id,
        ru.page_reached,
        ru.note,
        ru.created_at,
        b.title as book_title
      FROM reading_updates ru
      JOIN books b ON ru.book_id = b.id
      WHERE ru.user_id = ?
      ORDER BY ru.created_at DESC
    `);

    stmt.bind([req.params.id]);

    const results = [];

    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }

    stmt.free();
    res.json(results);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user feed." });
  }
});

router.get("/:id/stats", async (req, res) => {
  const db = await getDb();
  const userId = req.params.id;

  try {
    // followers count
    const followersStmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM follows
      WHERE following_id = ?
    `);
    followersStmt.bind([userId]);
    followersStmt.step();
    const followers = followersStmt.getAsObject().count;
    followersStmt.free();

    // following count
    const followingStmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM follows
      WHERE follower_id = ?
    `);
    followingStmt.bind([userId]);
    followingStmt.step();
    const following = followingStmt.getAsObject().count;
    followingStmt.free();

    // books saved count
    const booksStmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM reading_status
      WHERE user_id = ?
    `);
    booksStmt.bind([userId]);
    booksStmt.step();
    const books = booksStmt.getAsObject().count;
    booksStmt.free();

    res.json({
      followers,
      following,
      books
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load profile stats" });
  }
});

// update user profile
router.put("/:id", authMiddleware, async (req, res) => {
  const db = await getDb();
  const { name, bio, avatar_url } = req.body;

  if (req.user.id !== req.params.id) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  try {
    db.run(
      `
      UPDATE users
      SET name = ?, bio = ?, avatar_url = ?
      WHERE id = ?
      `,
      [name, bio, avatar_url, req.params.id]
    );

    saveDatabase();

    res.json({ message: "Profile updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;