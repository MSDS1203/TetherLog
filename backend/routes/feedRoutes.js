import express from "express";
import { getDb } from "../database.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
    const db = await getDb();
    const userId = req.user.id;

    try {
        // get users you follow
        const followStmt = db.prepare(`
            SELECT following_id 
            FROM follows 
            WHERE follower_id = ?
        `);

        followStmt.bind([userId]);

        const following = [];

        while (followStmt.step()) {
            following.push(followStmt.getAsObject().following_id);
        }

        followStmt.free();

        // user in their own feed
        following.push(userId);

        if (following.length === 0) {
            return res.json([]);
        }

        // updates from said group of users
        const placeholders = following.map(() => "?").join(",");

        const updateStmt = db.prepare(`
            SELECT 
                ru.*,
                u.name as user_name,
                b.title as book_title
            FROM reading_updates ru
            JOIN users u ON ru.user_id = u.id
            JOIN books b ON ru.book_id = b.id
            WHERE ru.user_id IN (${placeholders})
            ORDER BY ru.created_at DESC
            LIMIT 50
        `);

        updateStmt.bind(following);

        const feed = [];

        while (updateStmt.step()) {
            feed.push(updateStmt.getAsObject());
        }

        updateStmt.free();

        res.json(feed);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;