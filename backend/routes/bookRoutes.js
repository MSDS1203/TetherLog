import express from "express";
import { getDb, generateId, saveDatabase } from "../database.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

// create book
router.post("/", authMiddleware, async (req, res) => {
  const db = await getDb();

  const { title, author, cover_id, description, published_year, is_external } = req.body;

  if (!title || !author) {
    return res.status(400).json({ error: "Missing title or author" });
  }

  if (!is_external && req.user.role !== "author") {
    return res.status(403).json({ error: "Authors only" });
  }

  const id = generateId();
  try {
    const createdBy = is_external ? null : req.user.id;
    db.run(
        `
        INSERT INTO books (id, title, author, cover_url, description, published_year, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
        id,
        title,
        author,
        cover_id
            ? `https://covers.openlibrary.org/b/id/${cover_id}-M.jpg`
            : null,
        description || null,
        published_year || null,
        createdBy  
        ]
    );

    saveDatabase();
    res.json({ id });
    } catch (err) {
        console.error("Detailed error:", err);
        res.status(500).json({ error: err.message });
    }
});

router.get("/my", authMiddleware, async (req, res) => {
  const db = await getDb();

  const stmt = db.prepare(`
    SELECT *
    FROM books
    WHERE created_by = ?
    ORDER BY created_at DESC
  `);

  stmt.bind([req.user.id]);

  const books = [];
  while (stmt.step()) {
    books.push(stmt.getAsObject());
  }

  stmt.free();

  res.json(books);
});

// Search for book in local database by title and author
router.get("/search", async (req, res) => {
  const db = await getDb();
  const { title, author } = req.query;

  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  try {
    let stmt;
    if (author && author !== "Unknown author") {
      stmt = db.prepare(`
        SELECT id, title, author, cover_url 
        FROM books 
        WHERE title LIKE ? AND author LIKE ?
        LIMIT 1
      `);
      stmt.bind([`%${title}%`, `%${author}%`]);
    } else {
      stmt = db.prepare(`
        SELECT id, title, author, cover_url 
        FROM books 
        WHERE title LIKE ?
        LIMIT 1
      `);
      stmt.bind([`%${title}%`]);
    }

    if (stmt.step()) {
      const book = stmt.getAsObject();
      stmt.free();
      return res.json(book);
    }
    
    stmt.free();
    res.json(null);
  } catch (err) {
    console.error(err);
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

// author edits books
router.put("/:id", authMiddleware, async (req, res) => {
  const db = await getDb();
  const { title, description } = req.body;

  // check ownership
  const stmt = db.prepare(`
    SELECT created_by FROM books WHERE id = ?
  `);
  stmt.bind([req.params.id]);

  if (!stmt.step()) {
    stmt.free();
    return res.status(404).json({ error: "Book not found" });
  }

  const book = stmt.getAsObject();
  stmt.free();

  if (book.created_by !== req.user.id) {
    return res.status(403).json({ error: "Not your book" });
  }

  db.run(
    `UPDATE books SET title = ?, description = ? WHERE id = ?`,
    [title, description, req.params.id]
  );

  saveDatabase();

  res.json({ message: "Book updated" });
});

// delete book
router.delete("/:id", authMiddleware, async (req, res) => {
  const db = await getDb();

  const stmt = db.prepare(`SELECT created_by FROM books WHERE id = ?`);
  stmt.bind([req.params.id]);

  if (!stmt.step()) {
    stmt.free();
    return res.status(404).json({ error: "Book not found" });
  }

  const book = stmt.getAsObject();
  stmt.free();

  if (book.created_by !== req.user.id) {
    return res.status(403).json({ error: "Not your book" });
  }

  db.run(`DELETE FROM books WHERE id = ?`, [req.params.id]);
  saveDatabase();

  res.json({ message: "Book deleted" });
});

router.post("/ensure-exists", authMiddleware, async (req, res) => {
  const db = await getDb();
  const { title, author, cover_url, description, published_year } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Missing title" });
  }

  try {
    const stmt = db.prepare(`
      SELECT id FROM books WHERE title = ? AND author = ?
    `);
    stmt.bind([title, author || "Unknown author"]);
    
    if (stmt.step()) {
      const existing = stmt.getAsObject();
      stmt.free();
      
      if (cover_url) {
        const updateStmt = db.prepare(`UPDATE books SET cover_url = ? WHERE id = ?`);
        updateStmt.bind([cover_url, existing.id]);
        updateStmt.step();
        updateStmt.free();
        saveDatabase();
      }
      
      return res.json({ id: existing.id });
    }
    stmt.free();

    const id = generateId();
    
    db.run(`
      INSERT INTO books (id, title, author, cover_url, description, published_year)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      id, 
      title, 
      author || "Unknown author",
      cover_url || null,
      description || null,
      published_year || null
    ]);

    saveDatabase();
    res.json({ id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/debug/:id", async (req, res) => {
  const db = await getDb();
  const stmt = db.prepare(`SELECT id, title, cover_url FROM books WHERE id = ?`);
  stmt.bind([req.params.id]);
  
  if (stmt.step()) {
    const book = stmt.getAsObject();
    stmt.free();
    res.json(book);
  } else {
    stmt.free();
    res.json({ error: "Not found" });
  }
});

export default router;