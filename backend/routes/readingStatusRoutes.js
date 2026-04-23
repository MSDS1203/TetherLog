import express from "express";
import { getDb, generateId, saveDatabase } from "../database.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  const db = await getDb();
  const { book_id, status } = req.body;

  if (!book_id || !status) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    db.run(`
      INSERT INTO reading_status (id, user_id, book_id, status, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, book_id)
      DO UPDATE SET
        status = excluded.status,
        updated_at = CURRENT_TIMESTAMP
    `, [
      generateId(),
      req.user.id,
      book_id,
      status
    ]);
    console.log("BODY:", req.body);
    console.log("USER:", req.user);
    saveDatabase();
    res.json({ message: "Saved" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
});

router.get("/user/:userId", async (req, res) => {
  const db = await getDb();
  const { userId } = req.params;

  try {
    const stmt = db.prepare(`
      SELECT 
        rs.*,
        b.title,
        b.author,
        b.cover_url,
        b.total_pages
      FROM reading_status rs
      JOIN books b ON rs.book_id = b.id
      WHERE rs.user_id = ?
      ORDER BY rs.updated_at DESC
    `);
    
    stmt.bind([userId]);
    
    const results = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    
    stmt.free();
    res.json(results);
  } catch (err) {
    console.error("Error loading reading lists:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/my", authMiddleware, async (req, res) => {
  const db = await getDb();

  const stmt = db.prepare(`
    SELECT 
      rs.*,
      b.title,
      b.cover_url
    FROM reading_status rs
    JOIN books b ON rs.book_id = b.id
    WHERE rs.user_id = ?
    ORDER BY rs.updated_at DESC
  `);

  stmt.bind([req.user.id]);

  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }

  stmt.free();
  res.json(results);
});

router.delete("/:id", authMiddleware, async (req, res) => {
  const db = await getDb();

  db.run(
    `DELETE FROM reading_status WHERE id = ? AND user_id = ?`,
    [req.params.id, req.user.id]
  );

  saveDatabase();

  res.json({ message: "Removed" });
});

router.get("/:bookId", authMiddleware, async (req, res) => {
  const db = await getDb();

  const stmt = db.prepare(`
    SELECT status FROM reading_status
    WHERE user_id = ? AND book_id = ?
  `);

  stmt.bind([req.user.id, req.params.bookId]);

  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return res.json({ status: row.status }); 
  }

  stmt.free();
  res.json({ status: null }); 
});
export default router;