import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, getMe } from "../utils/api";

export default function EditProfile(){
    const [user, setUser] = useState(null);
    const [form, setForm] = useState({
        name: "",
        bio: "",
        avatar_url: ""
    });

    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadUser();
    }, []);

  async function loadUser() {
    try {
      const data = await getMe();
      setUser(data);
      setForm({
        name: data.name || "",
        bio: data.bio || "",
        avatar_url: data.avatar_url || ""
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      await apiRequest(`/api/users/${user.id}`, {
        method: "PUT",
        body: JSON.stringify(form)
      });

      alert("Profile updated!");
      navigate(`/profile/${user.id}`);
    } catch (err) {
      console.error(err);
      alert("Failed to update profile");
    }
  }

  async function becomeAuthor() {
    try {
      await apiRequest(`/api/auth/become-author`, {
        method: "POST"
      });

      alert("You are now an author!");

      const updated = await getMe();
      setUser(updated);

    } catch (err) {
      console.error(err);
      alert("Failed to become author");
    }
  }

  if (loading) return <p>Loading...</p>;
  if (!user) return <p>Error loading profile</p>;

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
      <h2>Edit Profile</h2>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "10px" }}>
          <label>Name</label><br />
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Bio</label><br />
          <textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}
          />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Avatar URL</label><br />
          <input
            name="avatar_url"
            value={form.avatar_url}
            onChange={handleChange}
          />
        </div>

        <button type="submit">Save Changes</button>
      </form>

      <div style={{ marginTop: "30px" }}>
        <h3>Author Access</h3>

        {user.role === "author" ? (
          <p>You are already an author.</p>
        ) : (
          <>
            <p>Become an author to publish your own books.</p>
            <button onClick={becomeAuthor}>
              Become an Author
            </button>
          </>
        )}
      </div>
    </div>
  );
}
