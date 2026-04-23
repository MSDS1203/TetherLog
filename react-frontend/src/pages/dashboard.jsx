import { useEffect, useState } from "react";
import { getToken } from "../utils/auth";
import { getMe, apiRequest } from "../utils/api";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [feed, setFeed] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      window.location.href = "/";
      return;
    }

    loadUser();
    loadFeed();
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

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "20px" }}>
      <h1 style={{ marginBottom: "20px" }}>Dashboard</h1>

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