import { useEffect, useState } from "react";
import { apiRequest } from "../utils/api";

export default function Search(){
    const [books, setBooks] = useState([]);
    const [query, setQuery] = useState("");
    const [users, setUsers] = useState([]);
    const [followingMap, setFollowingMap] = useState({});

  async function handleSearch() {
    if (!query.trim()) return;

    try {
      const bookResults = await apiRequest(`/api/search?q=${query}`);
      setBooks(bookResults);

      const userResults = await apiRequest(`/api/users/search?q=${query}`);
      setUsers(userResults);

      // check follow status for each user
      const statusChecks = await Promise.all(
        userResults.map(async (u) => {
          const res = await apiRequest(`/api/follows/${u.id}/status`);
          return { id: u.id, isFollowing: res.isFollowing };
        })
      );

      const map = {};
      statusChecks.forEach(s => {
        map[s.id] = s.isFollowing;
      });

      setFollowingMap(map);

    } catch (err) {
      console.error(err);
    }
  }

  async function toggleFollow(userId) {
    try {
      if (followingMap[userId]) {
        await apiRequest(`/api/follows/${userId}`, {
          method: "DELETE"
        });

        setFollowingMap(prev => ({
          ...prev,
          [userId]: false
        }));
      } else {
        await apiRequest(`/api/follows/${userId}`, {
          method: "POST"
        });

        setFollowingMap(prev => ({
          ...prev,
          [userId]: true
        }));
      }
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
          placeholder="Search books or users..."
        />

        <button onClick={handleSearch}>Search</button>

        <h3>Users</h3>
        {users.map(user => (
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
        {books.map((book, i) => (
          <div key={i}>
            <h4>{book.title}</h4>
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
      </section>
  );
}