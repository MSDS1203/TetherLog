import { useEffect, useState } from "react";
import { apiRequest } from "../utils/api";
import "./following.css"; 

export default function Followers() {
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("followers"); 

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const [followersData, followingData] = await Promise.all([
        apiRequest("/api/follows/followers/me"),
        apiRequest("/api/follows/following/me"),
      ]);

      setFollowers(followersData);
      setFollowing(followingData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div className="followers-container">
      <div className="tabs">
        <button
          className={`tab ${activeTab === "followers" ? "active" : ""}`}
          onClick={() => setActiveTab("followers")}
        >
          Followers ({followers.length})
        </button>
        <button
          className={`tab ${activeTab === "following" ? "active" : ""}`}
          onClick={() => setActiveTab("following")}
        >
          Following ({following.length})
        </button>
      </div>

      <div className="tab-content">
        {activeTab === "followers" ? (
          <>
            {followers.length === 0 ? (
              <p className="empty-state">No followers yet</p>
            ) : (
              <div className="users-list">
                {followers.map((u) => (
                  <div key={u.id} className="user-card">
                    <div className="user-avatar">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt={u.name} />
                      ) : (
                        <div className="avatar-placeholder">
                          {u.name?.charAt(0) || "U"}
                        </div>
                      )}
                    </div>
                    <div className="user-info">
                      <strong>{u.name}</strong>
                      <p>{u.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {following.length === 0 ? (
              <p className="empty-state">Not following anyone</p>
            ) : (
              <div className="users-list">
                {following.map((u) => (
                  <div key={u.id} className="user-card">
                    <div className="user-avatar">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt={u.name} />
                      ) : (
                        <div className="avatar-placeholder">
                          {u.name?.charAt(0) || "U"}
                        </div>
                      )}
                    </div>
                    <div className="user-info">
                      <strong>{u.name}</strong>
                      <p>{u.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}