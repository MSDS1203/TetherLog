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

router.get("/:id/feed", async(req, res) => {
    const db = await getDb();

    try{
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

        while (stmt.step()){
            results.push(stmt.getAsObject());
        }

        stmt.free();
        res.json(results);
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch user feed."});
    }
});

export default router;