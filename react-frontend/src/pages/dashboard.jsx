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

  async function searchBooks() {
    if (!query.trim()) {
      alert("Enter a search term");
      return;
    }

    try {
      const data = await apiRequest(`/api/search?q=${query}`);
      setBooks(data);
    } catch (err) {
      console.error(err);
      alert("Search failed");
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

      <section>
        <h2>Search Books</h2>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search books..."
        />

        <button onClick={searchBooks}>Search</button>

        <div>
          {books.map((book, i) => (
            <div key={i}>
              <h3>{book.title}</h3>
              <p>{book.author || "Unknown author"}</p>

              {book.cover_id && (
                <img
                  src={`https://covers.openlibrary.org/b/id/${book.cover_id}-M.jpg`}
                  alt=""
                />
              )}

              <hr />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}