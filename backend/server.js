import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import { authMiddleware } from "./middleware/authMiddleware.js";
// import readingStatusRoutes from "./routes/readingStatusRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/search", searchRoutes);
// app.use("/api/reading-status", authMiddleware, readingStatusRoutes);

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