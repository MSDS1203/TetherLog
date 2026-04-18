import { useEffect, useState } from "react";

export default function Search(){
    const [books, setBooks] = useState([]);
    const [query, setQuery] = useState("");

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

    return(
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
    )
}