import express from "express";
import { getDb, generateId, saveDatabase } from "../database.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// create book
router.post("/", authMiddleware, async (req, res) => {
  const db = await getDb();
  const { title, author, cover_id, description, published_year } = req.body;

  if (!title || !author) {
    return res.status(400).json({ error: "Missing title or author" });
  }

  const id = generateId();

  try {
    db.run(
      `
      INSERT INTO books (id, title, author, cover_url, description, published_year)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        id,
        title,
        author,
        cover_id
          ? `https://covers.openlibrary.org/b/id/${cover_id}-M.jpg`
          : null,
        description || null,
        published_year || null
      ]
    );

    saveDatabase();

    res.json({ id });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// read book
router.get("/:id", async (req, res) => {
  const db = await getDb();

  const stmt = db.prepare(`SELECT * FROM books WHERE id = ?`);
  stmt.bind([req.params.id]);

  if (!stmt.step()) {
    stmt.free();
    return res.status(404).json({ error: "Book not found" });
  }

  const book = stmt.getAsObject();
  stmt.free();

  if (!book.description && book.title) {
    try {
      const search = await fetch(
        `https://openlibrary.org/search.json?title=${encodeURIComponent(book.title)}`
      );
      const data = await search.json();

      const doc = data.docs?.[0];
      if (doc?.first_sentence?.[0]) {
        book.description = doc.first_sentence[0];
      }
    } catch (err) {
      console.log("OpenLibrary fallback failed");
    }
  }

  res.json(book);
});

export default router;