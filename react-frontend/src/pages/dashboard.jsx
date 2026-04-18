import { useEffect, useState } from "react";
import { getToken, logout } from "../utils/auth";
import { getMe, apiRequest } from "../utils/api";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState([]);

  // redirect if not logged in
  useEffect(() => {
    const token = getToken();
    if (!token) {
      window.location.href = "/";
    } else {
      loadUser();
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

  return (
    <div>
      <h1>Dashboard</h1>

      {user && (
        <p>
          Logged in as {user.name || user.email || user.id} ({user.role})
        </p>
      )}

      <button onClick={logout}>Logout</button>

      <section class="friend-update">
        <div class="container">
          <h4><b>Jane Doe</b></h4>
          <p>Currently reading...</p>
        </div>
      </section>
    </div>
  );
}