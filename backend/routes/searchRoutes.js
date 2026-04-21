import express from "express";

const router = express.Router();

router.get("/", async (req, res) => {
    const query = req.query.q;

    if (!query) {
        return res.status(400).json({ error: "Missing query" });
    }

    try {
        const response = await fetch(
            `https://openlibrary.org/search.json?q=${query}`,
            {
                headers: {
                    "User-Agent": "TetherlogApp"
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

export default router;