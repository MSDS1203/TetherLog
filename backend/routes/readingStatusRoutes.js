import express from "express";
import { getDb, generateId, saveDatabase } from "../database.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  const db = await getDb();
  const { book_id, status, rating, review } = req.body;

  if (!book_id || !status) {
    return res.status(400).json({ error: "Missing fields" });
  }

  if (rating && (Number(rating) < 1 || Number(rating) > 5)) {
    return res.status(400).json({ error: "Rating must be between 1 and 5" });
  }

  try {
    db.run(`
      INSERT INTO reading_status (id, user_id, book_id, status, rating, review, started_at, completed_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?,
        CASE WHEN ? = 'reading' THEN COALESCE((SELECT started_at FROM reading_status WHERE user_id = ? AND book_id = ?), DATE('now')) ELSE (SELECT started_at FROM reading_status WHERE user_id = ? AND book_id = ?) END,
        CASE WHEN ? = 'completed' THEN DATE('now') ELSE NULL END,
        CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, book_id)
      DO UPDATE SET
        status = excluded.status,
        rating = COALESCE(excluded.rating, reading_status.rating),
        review = COALESCE(excluded.review, reading_status.review),
        started_at = CASE
          WHEN excluded.status = 'reading' THEN COALESCE(reading_status.started_at, DATE('now'))
          ELSE reading_status.started_at
        END,
        completed_at = CASE
          WHEN excluded.status = 'completed' THEN DATE('now')
          WHEN excluded.status = 'reading' THEN reading_status.completed_at
          ELSE NULL
        END,
        updated_at = CURRENT_TIMESTAMP
    `, [
      generateId(),
      req.user.id,
      book_id,
      status,
      rating ? Number(rating) : null,
      review?.trim() || null,
      status,
      req.user.id,
      book_id,
      req.user.id,
      book_id,
      status
    ]);

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
    SELECT status, rating, review, current_page, started_at, completed_at FROM reading_status
    WHERE user_id = ? AND book_id = ?
  `);

  stmt.bind([req.user.id, req.params.bookId]);

  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return res.json({
      status: row.status,
      rating: row.rating,
      review: row.review,
      current_page: row.current_page,
      started_at: row.started_at,
      completed_at: row.completed_at
    });
  }

  stmt.free();
  res.json({ status: null }); 
});

router.get("/:bookId/reviews", async (req, res) => {
  const db = await getDb();

  try {
    const stmt = db.prepare(`
      SELECT
        rs.user_id,
        rs.rating,
        rs.review,
        rs.updated_at,
        u.name AS user_name
      FROM reading_status rs
      JOIN users u ON rs.user_id = u.id
      WHERE rs.book_id = ?
        AND (rs.rating IS NOT NULL OR (rs.review IS NOT NULL AND TRIM(rs.review) != ''))
      ORDER BY rs.updated_at DESC
    `);

    stmt.bind([req.params.bookId]);

    const reviews = [];
    while (stmt.step()) {
      reviews.push(stmt.getAsObject());
    }
    stmt.free();

    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load reviews" });
  }
});

// Post a reading update
router.post("/:bookId/update", authMiddleware, async (req, res) => {
  const db = await getDb();
  const { bookId } = req.params;
  const { page_reached, note } = req.body;
  const user_id = req.user.id;

  if (!page_reached) {
    return res.status(400).json({ error: "Page number is required" });
  }

  const id = generateId();

  try {
    db.run(`
      INSERT INTO reading_updates (id, user_id, book_id, page_reached, note)
      VALUES (?, ?, ?, ?, ?)
    `, [id, user_id, bookId, page_reached, note || null]);

    db.run(`
      UPDATE reading_status 
      SET current_page = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND book_id = ?
    `, [page_reached, user_id, bookId]);

    saveDatabase();
    res.json({ message: "Reading update posted!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to post update" });
  }
});

// Get reading updates
router.get("/:bookId/updates", async (req, res) => {
  const db = await getDb();
  const { bookId } = req.params;

  try {
    const stmt = db.prepare(`
      SELECT 
        ru.*,
        u.name as user_name,
        u.avatar_url
      FROM reading_updates ru
      JOIN users u ON ru.user_id = u.id
      WHERE ru.book_id = ?
      ORDER BY ru.created_at DESC
      LIMIT 20
    `);
    
    stmt.bind([bookId]);
    
    const updates = [];
    while (stmt.step()) {
      updates.push(stmt.getAsObject());
    }
    stmt.free();
    
    res.json(updates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load updates" });
  }
});


export default router;