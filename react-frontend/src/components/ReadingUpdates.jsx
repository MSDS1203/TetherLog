import { useState, useEffect } from "react";
import { apiRequest } from "../utils/api";

export default function ReadingUpdates({ bookId, bookTitle, currentPage }) {
  const [updates, setUpdates] = useState([]);
  const [pageNumber, setPageNumber] = useState(currentPage || "");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (bookId) {
      loadUpdates();
    }
  }, [bookId]);

  async function loadUpdates() {
    try {
      const data = await apiRequest(`/api/reading-status/${bookId}/updates`);
      setUpdates(data);
    } catch (err) {
      console.error("Failed to load updates:", err);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!pageNumber) return;

    setSubmitting(true);
    try {
      await apiRequest(`/api/reading-status/${bookId}/update`, {
        method: "POST",
        body: JSON.stringify({
          page_reached: parseInt(pageNumber),
          note: note || null
        })
      });

      // Reset form
      setPageNumber("");
      setNote("");
      setShowForm(false);
      
      // Reload updates
      await loadUpdates();
      
      alert("Reading update posted!");
    } catch (err) {
      console.error(err);
      alert("Failed to post update");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ marginTop: "30px", borderTop: "1px solid #eee", paddingTop: "20px" }}>
      <h3>Reading Progress</h3>
      
      <button 
        onClick={() => setShowForm(!showForm)}
        style={{
          padding: "8px 16px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          marginBottom: "20px"
        }}
      >
        {showForm ? "Cancel" : "+ Add Reading Update"}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: "20px", padding: "15px", background: "#f5f5f5", borderRadius: "8px" }}>
          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>
              <strong>Page {currentPage ? `(Currently on page ${currentPage})` : ""}</strong>
            </label>
            <input
              type="number"
              value={pageNumber}
              onChange={(e) => setPageNumber(e.target.value)}
              placeholder="What page are you on?"
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
              required
            />
          </div>
          
          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>Add a note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What do you think so far?"
              rows="3"
              style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ddd" }}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={submitting}
            style={{
              padding: "8px 16px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            {submitting ? "Posting..." : "Post Update"}
          </button>
        </form>
      )}

      <div>
        <h4>Recent Updates</h4>
        {updates.length === 0 ? (
          <p style={{ color: "#666", fontStyle: "italic" }}>No updates yet. Be the first to share your progress!</p>
        ) : (
          updates.map((update) => (
            <div key={update.id} style={{ padding: "10px", borderBottom: "1px solid #eee", marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "5px" }}>
                <strong>{update.user_name}</strong>
                <span style={{ color: "#007bff", fontSize: "14px" }}>
                  reached page {update.page_reached}
                </span>
                <span style={{ color: "#999", fontSize: "12px" }}>
                  {new Date(update.created_at).toLocaleDateString()}
                </span>
              </div>
              {update.note && (
                <p style={{ margin: "5px 0 0 0", color: "#555", fontStyle: "italic" }}>
                  "{update.note}"
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}