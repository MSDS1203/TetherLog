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

export default router;