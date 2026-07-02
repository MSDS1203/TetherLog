import { useEffect, useState } from "react";
import { getToken } from "../utils/auth";
import { getMe, apiRequest, getMyGoals, saveGoal } from "../utils/api";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [feed, setFeed] = useState([]);
  const [goalSummary, setGoalSummary] = useState({ goals: [], streak: { current: 0, longest: 0, lastActivityDate: null } });
  const [goalForm, setGoalForm] = useState({ yearly: "12", monthly: "2" });
  const [savingGoals, setSavingGoals] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      window.location.href = "/";
      return;
    }

    loadUser();
    loadFeed();
    loadGoals();
  }, []);

  async function loadUser() {
    try {
      const data = await getMe();
      setUser(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadFeed() {
    try {
      const res = await apiRequest("/api/feed"); 
      setFeed(res);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadGoals() {
    try {
      const res = await getMyGoals();
      setGoalSummary(res);

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const yearlyGoal = res.goals.find((goal) => goal.period_type === "yearly" && goal.year === currentYear);
      const monthlyGoal = res.goals.find((goal) => goal.period_type === "monthly" && goal.year === currentYear && goal.month === currentMonth);

      setGoalForm({
        yearly: yearlyGoal ? String(yearlyGoal.target_count) : "12",
        monthly: monthlyGoal ? String(monthlyGoal.target_count) : "2"
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function handleGoalSubmit(e) {
    e.preventDefault();

    try {
      setSavingGoals(true);
      const now = new Date();
      await saveGoal({
        period_type: "yearly",
        year: now.getFullYear(),
        target_count: Number(goalForm.yearly)
      });
      await saveGoal({
        period_type: "monthly",
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        target_count: Number(goalForm.monthly)
      });
      await loadGoals();
    } catch (err) {
      console.error(err);
      alert("Failed to save goals");
    } finally {
      setSavingGoals(false);
    }
  }

  const now = new Date();
  const yearlyGoal = goalSummary.goals.find((goal) => goal.period_type === "yearly" && goal.year === now.getFullYear());
  const monthlyGoal = goalSummary.goals.find((goal) => goal.period_type === "monthly" && goal.year === now.getFullYear() && goal.month === now.getMonth() + 1);

  function goalCard(title, goal, accentColor) {
    return (
      <div style={{ border: `1px solid ${accentColor}`, borderRadius: "12px", padding: "16px", backgroundColor: "#fff" }}>
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        {goal ? (
          <>
            <p style={{ margin: "0 0 8px 0" }}>
              {goal.progress} of {goal.target_count} books completed
            </p>
            <div style={{ height: "10px", background: "#edf2f7", borderRadius: "999px", overflow: "hidden" }}>
              <div style={{ width: `${goal.percentComplete}%`, height: "100%", background: accentColor }} />
            </div>
            <p style={{ marginTop: "8px", color: "#555" }}>{goal.percentComplete}% complete</p>
          </>
        ) : (
          <p style={{ color: "#666" }}>No goal set yet.</p>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "20px" }}>
      <h1 style={{ marginBottom: "20px" }}>Dashboard</h1>

      <section style={{ marginBottom: "28px", display: "grid", gap: "16px" }}>
        <div style={{ border: "1px solid #d9e2ec", borderRadius: "14px", padding: "18px", backgroundColor: "#f8fbff" }}>
          <h2 style={{ marginTop: 0 }}>Reading Goals</h2>
          <p style={{ margin: "0 0 14px 0", color: "#4a5568" }}>
            Current streak: <strong>{goalSummary.streak.current} days</strong> | Longest streak: <strong>{goalSummary.streak.longest} days</strong>
          </p>
          <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            {goalCard("Yearly Goal", yearlyGoal, "#2b6cb0")}
            {goalCard("Monthly Goal", monthlyGoal, "#2f855a")}
          </div>
        </div>

        <form onSubmit={handleGoalSubmit} style={{ border: "1px solid #e2e8f0", borderRadius: "14px", padding: "18px", backgroundColor: "#fff", display: "grid", gap: "12px" }}>
          <h3 style={{ margin: 0 }}>Update Your Targets</h3>
          <label>
            Books this year
            <input
              type="number"
              min="1"
              value={goalForm.yearly}
              onChange={(e) => setGoalForm((prev) => ({ ...prev, yearly: e.target.value }))}
              style={{ display: "block", width: "100%", marginTop: "6px" }}
            />
          </label>
          <label>
            Books this month
            <input
              type="number"
              min="1"
              value={goalForm.monthly}
              onChange={(e) => setGoalForm((prev) => ({ ...prev, monthly: e.target.value }))}
              style={{ display: "block", width: "100%", marginTop: "6px" }}
            />
          </label>
          <button type="submit" disabled={savingGoals} style={{ width: "fit-content" }}>
            {savingGoals ? "Saving..." : "Save Goals"}
          </button>
        </form>
      </section>

      <section>
        <h2 style={{ fontSize: "18px", marginBottom: "15px", color: "#333" }}>
          Friend Activity
        </h2>

        {feed.length === 0 ? (
          <p style={{ color: "#666", fontStyle: "italic" }}>No updates yet.</p>
        ) : (
          feed.map((item) => (
            <div 
              key={item.id} 
              style={{
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                padding: "15px",
                marginBottom: "12px",
                backgroundColor: "#fff",
                transition: "box-shadow 0.2s"
              }}
            >
              <h4 
                style={{ 
                  cursor: "pointer", 
                  color: "#007bff",
                  margin: "0 0 8px 0",
                  fontSize: "16px"
                }}
                onClick={() => navigate(`/profile/${item.user_id}`)}
              >
                {item.user_name}
              </h4>

              <p style={{ margin: "5px 0", color: "#333" }}>
                is reading <strong>{item.book_title}</strong>
              </p>

              <p style={{ margin: "5px 0", color: "#666", fontSize: "14px" }}>
                Page: {item.page_reached}
              </p>

              {item.note && (
                <p style={{ 
                  margin: "8px 0 0 0", 
                  color: "#555", 
                  fontStyle: "italic",
                  paddingLeft: "10px",
                  borderLeft: "3px solid #007bff"
                }}>
                  "{item.note}"
                </p>
              )}
            </div>
          ))
        )}
      </section>
    </div>
  );
}