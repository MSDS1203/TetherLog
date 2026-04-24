import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { apiRequest } from "../utils/api";
import ReadingUpdates from "../components/ReadingUpdates";

export default function BookDetails() {
  const { id, key } = useParams();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { state } = useLocation();
  const [readingStatus, setReadingStatus] = useState(null);

  useEffect(() => {
    async function init() {
      if (id) {
        await loadInternalBook();
        await loadStatus(id);
      } else if (key) {
        await loadExternalBook();
      }
    }

    init();
  }, [id, key]);

  async function loadInternalBook() {
    try {
      setLoading(true);
      const data = await apiRequest(`/api/books/${id}`);
      setBook(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load book.");
    } finally {
      setLoading(false);
    }
  }

  async function loadExternalBook() {
    try {
      setLoading(true);

      const res = await fetch(
        `https://openlibrary.org${decodeURIComponent(key)}.json`
      );

      const data = await res.json();

      const coverId = data.covers ? data.covers[0] : null;
      const coverUrl = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null;

      const formatted = {
        id: null,
        title: state?.title || data.title,
        author: state?.author || "Unknown author",
        description:
          typeof data.description === "string"
            ? data.description
            : data.description?.value || "",
        cover_url: state?.cover_url || coverUrl, 
        published_year: null
      };

      setBook(formatted);
      setError(null);
      
      await loadStatusByExternalInfo(formatted);
      
    } catch (err) {
      console.error(err);
      setError("Failed to load external book.");
    } finally {
      setLoading(false);
    }
  }

  async function loadStatusByExternalInfo(bookInfo) {
    if (!bookInfo || !bookInfo.title) return;
    
    try {
      const searchRes = await apiRequest(`/api/books/search?title=${encodeURIComponent(bookInfo.title)}&author=${encodeURIComponent(bookInfo.author || '')}`);
      
      if (searchRes && searchRes.id) {
        const statusRes = await apiRequest(`/api/reading-status/${searchRes.id}`);
        setReadingStatus(statusRes.status);
        
        setBook(prev => ({ ...prev, id: searchRes.id }));
      }
    } catch (err) {
      console.error("Failed to find book in database:", err);
    }
  }

  async function loadStatus(bookId) {
    try {
      const res = await apiRequest(`/api/reading-status/${bookId}`);
      setReadingStatus(res.status);
    } catch (err) {
      console.error("Failed to load status:", err);
      setReadingStatus(null);
    }
  }

  async function addToList(status) {
    try {
      let bookId = book.id;

      if (!bookId) {
        console.log("Saving book with cover_url:", book.cover_url);
        const res = await apiRequest("/api/books/ensure-exists", {
          method: "POST",
          body: JSON.stringify({
            title: book.title,
            author: book.author,
            cover_id: null,
            cover_url: book.cover_url,
            description: book.description,
            published_year: book.published_year,
            is_external: true
          })
        });

        console.log("Saved book response:", res);
        bookId = res.id;

        const savedBook = await apiRequest(`/api/books/debug/${bookId}`);
        console.log("Saved book data:", savedBook); 
        setBook((prev) => ({ ...prev, id: bookId }));
      }

      await apiRequest("/api/reading-status", {
        method: "POST",
        body: JSON.stringify({
          book_id: bookId,
          status
        })
      });

      const updated = await apiRequest(`/api/reading-status/${bookId}`);
      setReadingStatus(updated.status);

    } catch (err) {
      console.error(err);
      alert("Failed to update reading status");
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
              "https://placehold.co/200x300?text=No+Cover";
          }}
        />
      ) : (
        <img
          src="https://placehold.co/200x300?text=No+Cover"
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

      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        {readingStatus === "reading" ? (
          <>
            <button onClick={() => addToList("completed")}>
              Mark Completed
            </button>
            <button onClick={() => addToList("want_to_read")}>
              Move to Want to Read
            </button>
          </>
        ) : readingStatus === "want_to_read" ? (
          <>
            <button onClick={() => addToList("reading")}>
              Start Reading
            </button>
            <button onClick={() => addToList("completed")}>
              Mark as Completed
            </button>
          </>
        ) : readingStatus === "completed" ? (
          <>
            <button onClick={() => addToList("reading")}>
              Read Again
            </button>
            <button onClick={() => addToList("want_to_read")}>
              Move to Want to Read
            </button>
          </>
        ) : (
          <>
            <button onClick={() => addToList("reading")}>
              Start Reading
            </button>
            <button onClick={() => addToList("want_to_read")}>
              Want to Read
            </button>
            <button onClick={() => addToList("completed")}>
              Mark as Completed
            </button>
          </>
        )}
      </div>
    </div>
  );
}