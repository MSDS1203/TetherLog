import express from "express";
import bcrypt from "bcrypt";
import { getDb, generateId, saveDatabase } from "../database.js";
import { generateToken } from "../helpers/auth.js";
import { authMiddleware } from "../middleware/authMiddleware.js"; 

const router = express.Router();

// register
router.post("/register", async (req, res) => {
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

// login
router.post("/login", async (req, res) => {
    const db = await getDb();
    const { email, password } = req.body;

    const stmt = db.prepare("SELECT * FROM users WHERE email = ?");
    stmt.bind([email]);

    let user = null;
    if (stmt.step()) user = stmt.getAsObject();
    stmt.free();

    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    const token = generateToken(user);

    res.json({
        token,
        user: { id: user.id, email: user.email, role: user.role }
    });
});

// get current user
router.get("/me", authMiddleware, async (req, res) => {
    try {
        const db = await getDb();
        const stmt = db.prepare("SELECT id, name, email, role FROM users WHERE id = ?");
        stmt.bind([req.user.id]);
        
        let user = null;
        if (stmt.step()) user = stmt.getAsObject();
        stmt.free();
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;