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

  async function openBook(book) {
    try {
      let description = null;
      let publishedYear = null;

      if (book.key) {
        try {
          const res = await fetch(`https://openlibrary.org${book.key}.json`);
          const data = await res.json();

          if (data.description) {
            description =
              typeof data.description === "string"
                ? data.description
                : data.description.value || null;
          }

          if (data.first_publish_date) {
            const match = data.first_publish_date.match(/\d{4}/);
            if (match) publishedYear = parseInt(match[0]);
          }
        } catch (err) {
          console.log("OpenLibrary fetch failed", err);
        }
      }

      const author =
        book.author_name?.join(", ") || book.author || "Unknown author";

      const res = await apiRequest("/api/books", {
        method: "POST",
        body: JSON.stringify({
          title: book.title,
          author,
          cover_id: book.cover_i || book.cover_id,
          description,
          published_year: publishedYear,
        }),
      });

      navigate(`/books/${res.id}`);
    } catch (err) {
      console.error(err);
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