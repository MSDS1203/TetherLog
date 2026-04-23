import { useState } from "react";
import { apiRequest } from "../utils/api";
import { useNavigate } from "react-router-dom";

export default function Search() {
  const [books, setBooks] = useState([]);
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [followingMap, setFollowingMap] = useState({});
  const navigate = useNavigate();

  async function handleSearch() {
    if (!query.trim()) return;

    try {
      const bookResults = await apiRequest(`/api/search?q=${query}`);
      const userResults = await apiRequest(`/api/users/search?q=${query}`);

      setBooks(bookResults);
      setUsers(userResults);

      const statusChecks = await Promise.all(
        userResults.map(async (u) => {
          const res = await apiRequest(`/api/follows/${u.id}/status`);
          return { id: u.id, isFollowing: res.isFollowing };
        })
      );

      const map = {};
      statusChecks.forEach((s) => {
        map[s.id] = s.isFollowing;
      });

      setFollowingMap(map);
    } catch (err) {
      console.error(err);
    }
  }

  async function toggleFollow(userId) {
    try {
      const isFollowing = followingMap[userId];

      await apiRequest(`/api/follows/${userId}`, {
        method: isFollowing ? "DELETE" : "POST",
      });

      setFollowingMap((prev) => ({
        ...prev,
        [userId]: !isFollowing,
      }));
    } catch (err) {
      console.error(err);
    }
  }

  function openBook(book) {
    if (book.id) {
      navigate(`/books/${book.id}`);
    } else {
      navigate(`/books/external/${encodeURIComponent(book.key)}`, {
        state: {
          title: book.title,
          author: book.author_name?.join(", ") || book.author || "Unknown author",
          cover_url: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : null
        }
      });
    }
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <h2>Search</h2>

      <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search books or users..."
          style={{ flex: 1, padding: "8px", border: "1px solid #ddd", borderRadius: "4px" }}
        />
        <button onClick={handleSearch} style={{ padding: "8px 16px", cursor: "pointer" }}>Search</button>
      </div>

      <h3>Users</h3>
      {users.map((user) => (
        <div key={user.id} style={{ border: "1px solid #ddd", borderRadius: "6px", padding: "10px", marginBottom: "8px", display: "flex", justifyContent: "space-between" }}>
          <div>
            <strong>{user.name}</strong>
            <p style={{ margin: "2px 0 0", fontSize: "14px", color: "#666" }}>{user.email}</p>
          </div>
          <button onClick={() => toggleFollow(user.id)} style={{ padding: "4px 12px", cursor: "pointer" }}>
            {followingMap[user.id] ? "Following" : "Follow"}
          </button>
        </div>
      ))}

      <h3 style={{ marginTop: "24px" }}>Books</h3>
      {books.map((book, i) => {
        const coverId = book.cover_i || book.cover_id;
        return (
          <div key={i} style={{ display: "flex", gap: "15px", border: "1px solid #ddd", borderRadius: "6px", padding: "12px", marginBottom: "12px" }}>
            <img 
              src={coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : "https://via.placeholder.com/80x120?text=No+Cover"}
              alt={book.title}
              style={{ width: "60px", height: "90px", objectFit: "cover", borderRadius: "4px" }}
            />
            <div style={{ flex: 1 }}>
              <strong>{book.title}</strong>
              <p style={{ margin: "4px 0", fontSize: "14px", color: "#666" }}>
                {book.author_name?.join(", ") || book.author || "Unknown author"}
              </p>
              <button onClick={() => openBook(book)} style={{ marginTop: "6px", padding: "4px 12px", cursor: "pointer" }}>View / Save</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}