import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import {
  apiRequest,
  addBookToShelf,
  createShelf,
  getBookReviews,
  getMyShelves,
  getReadingStatus,
  removeBookFromShelf,
  saveReadingStatus
} from "../utils/api";
import ReadingUpdates from "../components/ReadingUpdates";

export default function BookDetails() {
  const { id, key } = useParams();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { state } = useLocation();
  const [readingStatus, setReadingStatus] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: "", review: "" });
  const [reviews, setReviews] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [newShelf, setNewShelf] = useState({ name: "", description: "" });
  const [savingReview, setSavingReview] = useState(false);
  const [savingShelf, setSavingShelf] = useState(false);

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

  useEffect(() => {
    if (!book?.id) return;
    loadReviews(book.id);
    loadShelves(book.id);
  }, [book?.id]);

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

      const formatted = {
        id: null,
        title: state?.title || data.title,
        author: state?.author || "Unknown author",
        description:
          typeof data.description === "string"
            ? data.description
            : data.description?.value || "",
        cover_url: state?.cover_url || null,
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
      const res = await getReadingStatus(bookId);
      setReadingStatus(res.status);
      setReviewForm({
        rating: res.rating ? String(res.rating) : "",
        review: res.review || ""
      });
    } catch (err) {
      console.error("Failed to load status:", err);
      setReadingStatus(null);
    }
  }

  async function loadReviews(bookId) {
    try {
      const res = await getBookReviews(bookId);
      setReviews(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("Failed to load reviews:", err);
      setReviews([]);
    }
  }

  async function loadShelves(bookId) {
    try {
      const res = await getMyShelves(bookId);
      setShelves(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("Failed to load shelves:", err);
      setShelves([]);
    }
  }

  async function ensureInternalBook() {
    if (book.id) {
      return book.id;
    }

    const res = await apiRequest("/api/books", {
      method: "POST",
      body: JSON.stringify({
        title: book.title,
        author: book.author,
        cover_id: null,
        description: book.description,
        published_year: book.published_year,
        is_external: true
      })
    });

    setBook((prev) => ({ ...prev, id: res.id }));
    return res.id;
  }

  async function addToList(status) {
    try {
      const bookId = await ensureInternalBook();

      await saveReadingStatus({
        book_id: bookId,
        status
      });

      await loadStatus(bookId);
      await loadShelves(bookId);
      await loadReviews(bookId);

    } catch (err) {
      console.error(err);
      alert("Failed to update reading status");
    }
  }

  async function handleSaveReview() {
    try {
      setSavingReview(true);
      const bookId = await ensureInternalBook();
      await saveReadingStatus({
        book_id: bookId,
        status: readingStatus || "completed",
        rating: reviewForm.rating ? Number(reviewForm.rating) : null,
        review: reviewForm.review
      });
      await loadStatus(bookId);
      await loadReviews(bookId);
      if (!readingStatus) {
        setReadingStatus("completed");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save review");
    } finally {
      setSavingReview(false);
    }
  }

  async function handleCreateShelf(e) {
    e.preventDefault();
    if (!newShelf.name.trim()) return;

    try {
      setSavingShelf(true);
      await createShelf(newShelf);
      setNewShelf({ name: "", description: "" });
      if (book?.id) {
        await loadShelves(book.id);
      } else {
        const shelvesRes = await getMyShelves();
        setShelves(Array.isArray(shelvesRes) ? shelvesRes : []);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to create shelf");
    } finally {
      setSavingShelf(false);
    }
  }

  async function toggleShelf(shelf) {
    try {
      setSavingShelf(true);
      const bookId = await ensureInternalBook();

      if (shelf.containsBook) {
        await removeBookFromShelf(shelf.id, bookId);
      } else {
        await addBookToShelf(shelf.id, bookId);
      }

      await loadShelves(bookId);
    } catch (err) {
      console.error(err);
      alert("Failed to update shelf");
    } finally {
      setSavingShelf(false);
    }
  }

  function renderStars(value) {
    const count = Number(value || 0);
    if (!count) return "No rating yet";
    return `${"★".repeat(count)}${"☆".repeat(5 - count)}`;
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

      <section style={{ marginTop: "32px", borderTop: "1px solid #ddd", paddingTop: "24px" }}>
        <h3>Rate and Review</h3>
        <p style={{ color: "#666", marginTop: 0 }}>
          Ratings and reviews are saved to your reading status. If this book is not on a shelf yet, saving a review will mark it completed.
        </p>
        <div style={{ display: "grid", gap: "12px", maxWidth: "520px" }}>
          <label>
            Rating
            <select
              value={reviewForm.rating}
              onChange={(e) => setReviewForm((prev) => ({ ...prev, rating: e.target.value }))}
              style={{ display: "block", width: "100%", marginTop: "6px" }}
            >
              <option value="">No rating</option>
              <option value="1">1 star</option>
              <option value="2">2 stars</option>
              <option value="3">3 stars</option>
              <option value="4">4 stars</option>
              <option value="5">5 stars</option>
            </select>
          </label>
          <label>
            Review
            <textarea
              rows="5"
              value={reviewForm.review}
              onChange={(e) => setReviewForm((prev) => ({ ...prev, review: e.target.value }))}
              placeholder="What worked for you? What didn’t?"
              style={{ display: "block", width: "100%", marginTop: "6px" }}
            />
          </label>
          <button onClick={handleSaveReview} disabled={savingReview}>
            {savingReview ? "Saving..." : "Save Review"}
          </button>
        </div>
      </section>

      <section style={{ marginTop: "32px", borderTop: "1px solid #ddd", paddingTop: "24px" }}>
        <h3>Shelves</h3>
        <div style={{ display: "grid", gap: "10px", maxWidth: "520px" }}>
          {shelves.map((shelf) => (
            <button
              key={shelf.id}
              onClick={() => toggleShelf(shelf)}
              disabled={savingShelf}
              style={{
                textAlign: "left",
                padding: "12px",
                borderRadius: "8px",
                border: shelf.containsBook ? "2px solid #1f7a4c" : "1px solid #d0d7de",
                background: shelf.containsBook ? "#eefbf3" : "#fff"
              }}
            >
              <strong>{shelf.name}</strong>
              <div style={{ fontSize: "14px", color: "#666", marginTop: "4px" }}>
                {shelf.description || "Custom shelf"}
              </div>
              <div style={{ fontSize: "13px", marginTop: "6px", color: shelf.containsBook ? "#1f7a4c" : "#555" }}>
                {shelf.containsBook ? "On this shelf" : "Add to this shelf"}
              </div>
            </button>
          ))}
        </div>

        <form onSubmit={handleCreateShelf} style={{ marginTop: "16px", maxWidth: "520px", display: "grid", gap: "10px" }}>
          <input
            value={newShelf.name}
            onChange={(e) => setNewShelf((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="New shelf name"
          />
          <input
            value={newShelf.description}
            onChange={(e) => setNewShelf((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Optional description"
          />
          <button type="submit" disabled={savingShelf}>
            {savingShelf ? "Saving..." : "Create Shelf"}
          </button>
        </form>
      </section>

      <section style={{ marginTop: "32px", borderTop: "1px solid #ddd", paddingTop: "24px" }}>
        <h3>Community Reviews</h3>
        {reviews.length === 0 ? (
          <p style={{ color: "#666" }}>No reviews yet.</p>
        ) : (
          <div style={{ display: "grid", gap: "14px" }}>
            {reviews.map((item) => (
              <div key={`${item.user_id}-${item.updated_at}`} style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center" }}>
                  <strong>{item.user_name}</strong>
                  <span style={{ color: "#b7791f" }}>{renderStars(item.rating)}</span>
                </div>
                {item.review && <p style={{ marginBottom: 0 }}>{item.review}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      {book.id && <ReadingUpdates bookId={book.id} />}
    </div>
  );
}