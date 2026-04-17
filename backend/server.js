import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcrypt";


dotenv.config();

import { getDb, generateId, saveDatabase } from "./database.js";
import { authMiddleware } from "./middleware/authMiddleware.js";
import { generateToken } from "./helpers/auth.js";

console.log("JWT:", process.env.JWT_SECRET);
const app = express();
app.use(cors());
app.use(express.json());

// saving book to db
app.post('/api/books', authMiddleware, async (req, res) => {
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

// register 
app.post("/api/register", async (req, res) => {
    const db = await getDb();
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
        return res.status(400).json({ error: "Missing fields" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        db.run(
            `INSERT INTO users (id, name, email, password_hash, role)
             VALUES (?, ?, ?, ?, ?)`,
            [generateId(), name, email, hashedPassword, "reader"]
        );

        saveDatabase();
        res.json({ message: "User created" });

    } catch (err) {
        if (err.message.includes("UNIQUE")) {
            return res.status(409).json({ error: "Email already exists" });
        }

        res.status(500).json({ error: err.message });
    }
});

// login route
app.post("/api/login", async (req, res) => {
    const db = await getDb();
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Missing fields" });
    }

    const stmt = db.prepare("SELECT * FROM users WHERE email = ?");
    stmt.bind([email]);

    let user = null;

    if (stmt.step()) {
        user = stmt.getAsObject();
    }

    stmt.free();

    if (!user || !user.password_hash) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken(user);

    res.json({token, user: {id: user.id, email: user.email, role: user.role}});
});


// test routes
app.get('/', (req, res) => {
    res.json({ message: "API is running" });
});

app.get("/api/me", authMiddleware, (req, res) => {
    res.json(req.user);
});

// search route
app.get('/api/search', async (req, res) => {
    const query = req.query.q;

    if (!query) {
        return res.status(400).json({ error: "Missing query" });
    }

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