import { useEffect, useState } from "react";
import { apiRequest } from "../utils/api";
import { useNavigate } from "react-router-dom";

export default function MyBooks() {
  const [books, setBooks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const data = await apiRequest("/api/books/my");
      setBooks(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(id) {
    try {
      await apiRequest(`/api/books/${id}`, {
        method: "DELETE",
      });
      setBooks(books.filter((b) => b.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto" }}>
      <h2>My Books (Author Dashboard)</h2>

      <button onClick={() => navigate("/books/new")}>
        + Create Book
      </button>

      {books.length === 0 ? (
        <p>No books yet</p>
      ) : (
        books.map((b) => (
          <div key={b.id} style={{ borderBottom: "1px solid #ddd", padding: "10px" }}>
            <h3>{b.title}</h3>
            <p>{b.description}</p>

            <button onClick={() => navigate(`/books/${b.id}`)}>
              View
            </button>

            <button onClick={() => navigate(`/books/edit/${b.id}`)}>
              Edit
            </button>

            <button onClick={() => handleDelete(b.id)}>
              Delete
            </button>
          </div>
        ))
      )}
    </div>
  );
}