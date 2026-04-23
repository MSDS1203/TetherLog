import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiRequest } from "../utils/api";

export default function EditBook() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadBook();
  }, [id]);

  async function loadBook() {
    try {
      const data = await apiRequest(`/api/books/${id}`);
      setFormData({
        title: data.title || "",
        description: data.description || "",
      });
    } catch (err) {
      console.error(err);
      setError("Failed to load book");
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      await apiRequest(`/api/books/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
        }),
      });
      navigate(`/books/${id}`);
    } catch (err) {
      console.error(err);
      setError("Failed to update book");
    } finally {
      setLoading(false);
    }
  };

  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
      <h2>Edit Book</h2>
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            style={{ width: "100%", padding: "8px" }}
          />
        </div>
        
        <div style={{ marginBottom: "15px" }}>
          <label style={{ display: "block", marginBottom: "5px" }}>Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows="6"
            style={{ width: "100%", padding: "8px" }}
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          style={{ padding: "10px 20px", marginRight: "10px" }}
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
        
        <button 
          type="button" 
          onClick={() => navigate(`/books/${id}`)}
          style={{ padding: "10px 20px" }}
        >
          Cancel
        </button>
      </form>
    </div>
  );
}