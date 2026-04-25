import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import { authMiddleware } from "./middleware/authMiddleware.js";
import feedRoutes from "./routes/feedRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import followRoutes from "./routes/followRoutes.js";
import readingStatusRoutes from "./routes/readingStatusRoutes.js";
import shelfRoutes from "./routes/shelfRoutes.js";
import goalRoutes from "./routes/goalRoutes.js";

dotenv.config();

if (!process.env.JWT_SECRET) {
    throw new Error("Missing JWT_SECRET. Add it to backend/.env before starting the server.");
}

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/users", userRoutes);
app.use("/api/follows", followRoutes);
app.use("/api/reading-status", readingStatusRoutes);
app.use("/api/shelves", shelfRoutes);
app.use("/api/goals", goalRoutes);

// route test
app.get("/", (req, res) => {
    res.json({ message: "API is running" });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong" });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Now running on http://localhost:${PORT}`);
});