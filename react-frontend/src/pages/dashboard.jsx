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
    <div>
      <h1>Dashboard</h1>

      <section className="friend-updates">
        <h2>Friend Activity</h2>

        {feed.length === 0 ? (
          <p>Hmmm... looks like no updates yet.</p>
        ) : (
          feed.map((item) => (
            <div key={item.id} className="container">
              <h4
                style={{ cursor: "pointer", color: "blue" }}
                onClick={() => navigate(`/profile/${item.user_id}`)}
              >
                <b>{item.user_name}</b>
              </h4>

              <p>
                is reading <b>{item.book_title}</b>
              </p>

              <p>Page: {item.page_reached}</p>

              {item.note && <p>“{item.note}”</p>}
            </div>
          ))
        )}
      </section>
    </div>
  );
}