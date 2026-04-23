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

      // follow status check
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
          author:
            book.author_name?.join(", ") ||
            book.author ||
            "Unknown author",
          cover_url: book.cover_i
            ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
            : null
        }
      });
    }
  }

  return (
    <section>
      <h2>Search</h2>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        placeholder="Search books or users..."
      />

      <button onClick={handleSearch}>Search</button>

      <h3>Users</h3>
      {users.map((user) => (
        <div key={user.id}>
          <strong>{user.name}</strong>
          <p>{user.email}</p>

          <button onClick={() => toggleFollow(user.id)}>
            {followingMap[user.id] ? "Following" : "Follow"}
          </button>

          <hr />
        </div>
      ))}

      <h3>Books</h3>
      {books.map((book, i) => {
        const coverId = book.cover_i || book.cover_id;

        return (
          <div key={i}>
            <h4>{book.title}</h4>

            <p>
              <strong>Author:</strong>{" "}
              {book.author_name?.join(", ") ||
                book.author ||
                "Unknown author"}
            </p>

            {book.first_publish_year && (
              <p>
                <strong>Published:</strong> {book.first_publish_year}
              </p>
            )}

            {coverId ? (
              <img
                src={`https://covers.openlibrary.org/b/id/${coverId}-M.jpg`}
                alt={book.title}
                style={{ width: "120px", borderRadius: "4px" }}
                onError={(e) => {
                  e.currentTarget.src =
                    "https://via.placeholder.com/120x180?text=No+Cover";
                }}
              />
            ) : (
              <img
                src="https://via.placeholder.com/120x180?text=No+Cover"
                alt="No cover"
              />
            )}

            <button onClick={() => openBook(book)}>
              View / Save Book
            </button>

            <hr />
          </div>
        );
      })}
    </section>
  );
}