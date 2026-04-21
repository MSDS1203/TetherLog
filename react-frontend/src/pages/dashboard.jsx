import { useEffect, useState } from "react";
import { getToken, logout } from "../utils/auth";
import { getMe, apiRequest } from "../utils/api";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState([]);
  const [feed, setFeed] = useState([]);

  // redirect if not logged in
  useEffect(() => {
    const token = getToken();
    if (!token) {
      window.location.href = "/";
    } else {
      loadUser();
      loadFeed();
    }
  }, []);

  async function loadUser() {
    try {
      const data = await getMe();
      setUser(data);
    } catch (err) {
      console.error(err);
    }
  }

  // fetching feed 
  async function loadFeed() {
  try {
    const res = await apiRequest("/api/feed", "GET");
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
              <h4>
                <b>{item.user_name}</b>
              </h4>

              <p>
                is reading <b>{item.book_title}</b>
              </p>

              <p>
                Page: {item.page_reached}
              </p>

              {item.note && <p>“{item.note}”</p>}
            </div>
          ))
        )}
      </section>
    </div>
  );
}