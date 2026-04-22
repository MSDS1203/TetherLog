import express from "express";
import { getDb } from "../database.js";

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

export default router;