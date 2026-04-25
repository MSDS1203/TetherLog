import express from "express";
import { getDb, generateId, saveDatabase } from "../database.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

function getProgressCount(db, userId, goal) {
  const params = [userId, String(goal.year)];
  let query = `
    SELECT COUNT(*) AS count
    FROM reading_status
    WHERE user_id = ?
      AND status = 'completed'
      AND completed_at IS NOT NULL
      AND strftime('%Y', completed_at) = ?
  `;

  if (goal.period_type === "monthly" && goal.month) {
    query += ` AND strftime('%m', completed_at) = ?`;
    params.push(String(goal.month).padStart(2, "0"));
  }

  const stmt = db.prepare(query);
  stmt.bind(params);
  stmt.step();
  const count = Number(stmt.getAsObject().count || 0);
  stmt.free();
  return count;
}

function getStreakSummary(db, userId) {
  const stmt = db.prepare(`
    SELECT DISTINCT DATE(created_at) AS activity_date
    FROM reading_updates
    WHERE user_id = ?
    ORDER BY activity_date DESC
  `);

  stmt.bind([userId]);

  const dates = [];
  while (stmt.step()) {
    dates.push(stmt.getAsObject().activity_date);
  }
  stmt.free();

  if (dates.length === 0) {
    return { current: 0, longest: 0, lastActivityDate: null };
  }

  const normalize = (value) => new Date(`${value}T00:00:00Z`);
  const millisInDay = 24 * 60 * 60 * 1000;
  let current = 0;
  let longest = 1;
  let running = 1;

  const today = new Date();
  const utcToday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const latestDate = normalize(dates[0]);
  const dayGap = Math.round((utcToday - latestDate) / millisInDay);

  if (dayGap <= 1) {
    current = 1;
    for (let index = 1; index < dates.length; index += 1) {
      const previousDate = normalize(dates[index - 1]);
      const nextDate = normalize(dates[index]);
      if (Math.round((previousDate - nextDate) / millisInDay) === 1) {
        current += 1;
      } else {
        break;
      }
    }
  }

  for (let index = 1; index < dates.length; index += 1) {
    const previousDate = normalize(dates[index - 1]);
    const nextDate = normalize(dates[index]);
    if (Math.round((previousDate - nextDate) / millisInDay) === 1) {
      running += 1;
      longest = Math.max(longest, running);
    } else {
      running = 1;
    }
  }

  return {
    current,
    longest,
    lastActivityDate: dates[0]
  };
}

function getGoalSummary(db, userId) {
  const stmt = db.prepare(`
    SELECT *
    FROM reading_goals
    WHERE user_id = ?
    ORDER BY year DESC, month DESC
  `);
  stmt.bind([userId]);

  const goals = [];
  while (stmt.step()) {
    const goal = stmt.getAsObject();
    const progress = getProgressCount(db, userId, goal);
    goals.push({
      ...goal,
      progress,
      percentComplete: Math.min(100, Math.round((progress / goal.target_count) * 100))
    });
  }
  stmt.free();

  return {
    goals,
    streak: getStreakSummary(db, userId)
  };
}

router.get("/me", authMiddleware, async (req, res) => {
  const db = await getDb();
  res.json(getGoalSummary(db, req.user.id));
});

router.get("/user/:userId", async (req, res) => {
  const db = await getDb();
  res.json(getGoalSummary(db, req.params.userId));
});

router.post("/", authMiddleware, async (req, res) => {
  const db = await getDb();
  const { period_type, target_count, year, month } = req.body;

  if (!["yearly", "monthly"].includes(period_type)) {
    return res.status(400).json({ error: "Invalid goal type" });
  }

  if (!target_count || Number(target_count) < 1) {
    return res.status(400).json({ error: "Goal target must be at least 1" });
  }

  if (!year) {
    return res.status(400).json({ error: "Year is required" });
  }

  if (period_type === "monthly" && (!month || Number(month) < 1 || Number(month) > 12)) {
    return res.status(400).json({ error: "Month is required for monthly goals" });
  }

  try {
    db.run(
      `
      INSERT INTO reading_goals (id, user_id, period_type, year, month, target_count, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, period_type, year, month)
      DO UPDATE SET
        target_count = excluded.target_count,
        updated_at = CURRENT_TIMESTAMP
      `,
      [
        generateId(),
        req.user.id,
        period_type,
        Number(year),
        period_type === "monthly" ? Number(month) : null,
        Number(target_count)
      ]
    );
    saveDatabase();
    res.json({ message: "Goal saved" });
  } catch (err) {
    res.status(500).json({ error: "Failed to save goal" });
  }
});

export default router;