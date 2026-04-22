import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiRequest } from "../utils/api";

export default function BookDetails() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBook();
  }, [id]);

  async function loadBook() {
    try {
      setLoading(true);

      const data = await apiRequest(`/api/books/${id}`);
    
      console.log(data);
      setBook(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load book.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;
  if (!book) return <p>Book not found.</p>;

  return (
    <div>
      <h2>{book.title}</h2>

      <p>
        <strong>Author:</strong>{" "}
        {book.author || "Unknown author"}
      </p>

      {book.cover_url ? (
        <img
          src={book.cover_url}
          alt={book.title}
          style={{ maxWidth: "200px", borderRadius: "6px" }}
          onError={(e) => {
            e.currentTarget.src =
              "https://via.placeholder.com/200x300?text=No+Cover";
          }}
        />
      ) : (
        <img
          src="https://via.placeholder.com/200x300?text=No+Cover"
          alt="No cover"
        />
      )}

      <p style={{ marginTop: "10px" }}>
        {book.description?.trim()
          ? book.description
          : "No description available."}
      </p>

      {book.published_year && (
        <p>
          <strong>Published:</strong> {book.published_year}
        </p>
      )}
    </div>
  );
}