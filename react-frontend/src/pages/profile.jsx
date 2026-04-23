import { useEffect, useState } from "react";
import { getMe, apiRequest } from "../utils/api";
import { useParams, Link } from "react-router-dom";

export default function Profile() {
  const { id } = useParams();

  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activity, setActivity] = useState([]);

  const [stats, setStats] = useState({
    followers: 0,
    following: 0,
    books: 0,
  });

  useEffect(() => {
    loadCurrentUser();
    if (currentUser && !id) return;

    loadUser(id);
    loadActivity(id);
    loadFollowStatus(id);
    loadStats(id);
  }, [id]);

  async function loadCurrentUser() {
    const me = await getMe();
    setCurrentUser(me);
  }

  async function loadUser(userId) {
    const data = await apiRequest(`/api/users/${userId}`);
    setUser(data);
  }

  async function loadFollowStatus(userId) {
    const data = await apiRequest(`/api/follows/${userId}/status`);
    setIsFollowing(data.isFollowing);
  }

  async function loadActivity(userId) {
    const data = await apiRequest(`/api/users/${userId}/feed`);
    setActivity(data);
  }

  async function loadStats(userId) {
    const data = await apiRequest(`/api/users/${userId}/stats`);
    setStats(data);
  }

  async function toggleFollow() {
    try {
      if (isFollowing) {
        await apiRequest(`/api/follows/${id}`, { method: "DELETE" });
        setIsFollowing(false);
      } else {
        await apiRequest(`/api/follows/${id}`, { method: "POST" });
        setIsFollowing(true);
      }
    } catch (err) {
      console.error(err);
    }
  }

  if (!user) return <p>Loading...</p>;

  const isMe = currentUser?.id === user.id;

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "20px" }}>
      
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ marginBottom: "5px" }}>{user.name}</h2>
        <p style={{ color: "#666" }}>{user.bio || "No bio yet."}</p>

        {user.avatar_url && (
          <img
            src={user.avatar_url}
            alt="avatar"
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              marginTop: "10px",
            }}
          />
        )}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          background: "#f5f5f5",
          padding: "10px 15px",
          borderRadius: "8px",
          marginBottom: "15px",
        }}
      >
        <Link to={`/profile/${id}/followers`}>
          <strong>{stats.followers}</strong> Followers
        </Link>

        <Link to={`/profile/${id}/following`}>
          <strong>{stats.following}</strong> Following
        </Link>

        <div>
          <strong>{stats.books}</strong> Books
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        {isMe ? (
          <button>Edit Profile</button>
        ) : (
          <button onClick={toggleFollow}>
            {isFollowing ? "Following" : "Follow"}
          </button>
        )}
      </div>

      <div>
        <h3>Recent Activity</h3>

        {activity.length === 0 ? (
          <p>No activity yet.</p>
        ) : (
          activity.map((item) => (
            <div
              key={item.id}
              style={{
                padding: "10px",
                borderBottom: "1px solid #eee",
              }}
            >
              <p>
                Reading <b>{item.book_title}</b>
              </p>
              <p>Page: {item.page_reached}</p>
              {item.note && <p>"{item.note}"</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}