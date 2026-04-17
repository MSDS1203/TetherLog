import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { getDb, generateId, saveDatabase } from "./database.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());


app.post('/api/books', async (req, res) => {
    const db = await getDb();
    const { title, author, cover_id } = req.body;

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

app.get('/', (req, res) => {
    res.json({ message: "API is running" });
});

app.get('/api/search', async (req, res) => {
    const query = req.query.q;

    try {
        const response = await fetch(
            `https://openlibrary.org/search.json?q=${query}`,
            {
                headers: {
                    "User-Agent": "TetherlogApp (your@email.com)"
                }
            }
        );

        const data = await response.json();

        const books = data.docs.slice(0, 10).map(book => ({
            title: book.title,
            author: book.author_name?.[0],
            key: book.key,
            cover_id: book.cover_i
        }));

        res.json(books);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});