import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiRequest } from "../utils/api";

export default function UpdateProgress() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [pageNumber, setPageNumber] = useState("");
  const [note, setNote] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBook();
  }, [bookId]);

  async function loadBook() {
    try {
      const book = await apiRequest(`/api/books/${bookId}`);
      setBookTitle(book.title);
      
      const status = await apiRequest(`/api/reading-status/${bookId}`);
      if (status.current_page) {
        setPageNumber(status.current_page);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiRequest(`/api/reading-status/${bookId}/update`, {
        method: "POST",
        body: JSON.stringify({
          page_reached: parseInt(pageNumber),
          note: note || null
        })
      });
      alert("Progress updated");
      navigate(`/books/${bookId}`);
    } catch (err) {
      console.error(err);
      alert("Failed to update");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ maxWidth: "500px", margin: "0 auto", padding: "20px" }}>
      <h2>Update Reading Progress</h2>
      <p><strong>{bookTitle}</strong></p>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "15px" }}>
          <label>What page are you on?</label>
          <input
            type="number"
            value={pageNumber}
            onChange={(e) => setPageNumber(e.target.value)}
            required
            min="0"
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
          />
        </div>
        
        <div style={{ marginBottom: "15px" }}>
          <label>Add a note (optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows="4"
            style={{ width: "100%", padding: "8px", marginTop: "5px" }}
            placeholder="How's the book? Any thoughts?"
          />
        </div>
        
        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            type="submit" 
            disabled={submitting}
            style={{ padding: "8px 16px", cursor: "pointer" }}
          >
            {submitting ? "Posting..." : "Post Update"}
          </button>
          <button 
            type="button" 
            onClick={() => navigate(-1)}
            style={{ padding: "8px 16px", cursor: "pointer" }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}