import express from "express";
import { getDb, generateId, saveDatabase } from "../database.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
    const db = await getDb();
    const { title, author, cover_id } = req.body;

    if (!title || !author) {
        return res.status(400).json({ error: "Missing title or author" });
    }

    try {
        db.run(`
            INSERT INTO books (id, title, author, cover_url)
            VALUES (?, ?, ?, ?)
        `, [
            generateId(),
            title,
            author,
            cover_id ? `https://covers.openlibrary.org/b/id/${cover_id}-M.jpg` : null
        ]);

        saveDatabase();
        res.json({ message: "Book saved" });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;