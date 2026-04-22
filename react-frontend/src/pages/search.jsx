import { useEffect, useState } from "react";
import { apiRequest } from "../utils/api";

export default function Search(){
    const [books, setBooks] = useState([]);
    const [query, setQuery] = useState("");
    const [users, setUsers] = useState([]);

  async function handleSearch() {
      if (!query.trim()) return;

      try {
        // search books
        const bookResults = await apiRequest(`/api/search?q=${query}`);
        setBooks(bookResults);

        // search users
        const userResults = await apiRequest(`/api/users/search?q=${query}`);
        setUsers(userResults);

      } catch (err) {
        console.error(err);
      }
    }

    async function followUser(userId) {
      try {
        await apiRequest(`/api/follows/${userId}`, {
          method: "POST"
        });

        alert("Followed!");
      } catch (err) {
        alert("Failed to follow");
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

            <button onClick={() => followUser(user.id)}>
              Follow
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