import express from "express";
import { getDb, generateId, saveDatabase } from "../database.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

const DEFAULT_SHELVES = [
  {
    name: "Favorites",
    description: "Books you would recommend or revisit."
  },
  {
    name: "Did Not Finish",
    description: "Books you stopped before completion."
  }
];

async function ensureDefaultShelves(db, userId) {
  for (const shelf of DEFAULT_SHELVES) {
    db.run(
      `
      INSERT OR IGNORE INTO shelves (id, user_id, name, description, is_default)
      VALUES (?, ?, ?, ?, 1)
      `,
      [generateId(), userId, shelf.name, shelf.description]
    );
  }
  saveDatabase();
}

function loadShelvesWithBooks(db, userId, bookId = null) {
  const stmt = db.prepare(`
    SELECT
      s.id,
      s.name,
      s.description,
      s.is_default,
      b.id AS book_id,
      bk.title,
      bk.author,
      bk.cover_url,
      CASE WHEN ? IS NOT NULL AND b.book_id = ? THEN 1 ELSE 0 END AS contains_selected_book
    FROM shelves s
    LEFT JOIN shelf_books b ON s.id = b.shelf_id
    LEFT JOIN books bk ON b.book_id = bk.id
    WHERE s.user_id = ?
    ORDER BY s.is_default DESC, s.created_at ASC, b.added_at DESC
  `);

  stmt.bind([bookId, bookId, userId]);

  const shelves = new Map();

  while (stmt.step()) {
    const row = stmt.getAsObject();
    if (!shelves.has(row.id)) {
      shelves.set(row.id, {
        id: row.id,
        name: row.name,
        description: row.description,
        is_default: Boolean(row.is_default),
        containsBook: false,
        books: []
      });
    }

    const shelf = shelves.get(row.id);
    if (row.contains_selected_book) {
      shelf.containsBook = true;
    }

    if (row.book_id) {
      shelf.books.push({
        id: row.book_id,
        title: row.title,
        author: row.author,
        cover_url: row.cover_url
      });
    }
  }

  stmt.free();
  return Array.from(shelves.values());
}

router.get("/my", authMiddleware, async (req, res) => {
  const db = await getDb();
  await ensureDefaultShelves(db, req.user.id);

  const shelves = loadShelvesWithBooks(db, req.user.id, req.query.bookId || null);
  res.json(shelves);
});

router.get("/user/:userId", async (req, res) => {
  const db = await getDb();
  await ensureDefaultShelves(db, req.params.userId);
  const shelves = loadShelvesWithBooks(db, req.params.userId, null);
  res.json(shelves);
});

router.post("/", authMiddleware, async (req, res) => {
  const db = await getDb();
  const { name, description } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Shelf name is required" });
  }

  try {
    db.run(
      `
      INSERT INTO shelves (id, user_id, name, description, is_default)
      VALUES (?, ?, ?, ?, 0)
      `,
      [generateId(), req.user.id, name.trim(), description?.trim() || null]
    );
    saveDatabase();
    res.json({ message: "Shelf created" });
  } catch (err) {
    if (err.message.includes("UNIQUE")) {
      return res.status(409).json({ error: "You already have a shelf with that name" });
    }

    res.status(500).json({ error: "Failed to create shelf" });
  }
});

router.post("/:shelfId/books", authMiddleware, async (req, res) => {
  const db = await getDb();
  const { shelfId } = req.params;
  const { book_id } = req.body;

  if (!book_id) {
    return res.status(400).json({ error: "Book is required" });
  }

  const shelfStmt = db.prepare(`SELECT id FROM shelves WHERE id = ? AND user_id = ?`);
  shelfStmt.bind([shelfId, req.user.id]);
  const exists = shelfStmt.step();
  shelfStmt.free();

  if (!exists) {
    return res.status(404).json({ error: "Shelf not found" });
  }

  try {
    db.run(
      `
      INSERT OR IGNORE INTO shelf_books (id, shelf_id, book_id)
      VALUES (?, ?, ?)
      `,
      [generateId(), shelfId, book_id]
    );
    saveDatabase();
    res.json({ message: "Book added to shelf" });
  } catch (err) {
    res.status(500).json({ error: "Failed to add book to shelf" });
  }
});

router.delete("/:shelfId/books/:bookId", authMiddleware, async (req, res) => {
  const db = await getDb();

  const shelfStmt = db.prepare(`SELECT id FROM shelves WHERE id = ? AND user_id = ?`);
  shelfStmt.bind([req.params.shelfId, req.user.id]);
  const exists = shelfStmt.step();
  shelfStmt.free();

  if (!exists) {
    return res.status(404).json({ error: "Shelf not found" });
  }

  db.run(
    `DELETE FROM shelf_books WHERE shelf_id = ? AND book_id = ?`,
    [req.params.shelfId, req.params.bookId]
  );
  saveDatabase();

  res.json({ message: "Book removed from shelf" });
});

export default router;