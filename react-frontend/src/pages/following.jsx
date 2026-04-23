import { useEffect, useState } from "react";
import { apiRequest } from "../utils/api";

export default function Followers() {
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);

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
    <div>
      <h2>Followers</h2>

      {followers.length === 0 ? (
        <p>No followers yet</p>
      ) : (
        followers.map((u) => (
          <div key={u.id}>
            <strong>{u.name}</strong>
            <p>{u.email}</p>
            <hr />
          </div>
        ))
      )}

      <h2>Following</h2>

      {following.length === 0 ? (
        <p>Not following anyone</p>
      ) : (
        following.map((u) => (
          <div key={u.id}>
            <strong>{u.name}</strong>
            <p>{u.email}</p>
            <hr />
          </div>
        ))
      )}
    </div>
  );
}