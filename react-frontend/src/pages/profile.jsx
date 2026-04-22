import { useEffect, useState } from "react";
import { getMe, apiRequest } from "../utils/api";
import { useParams } from "react-router-dom";

export default function Profile() {
  const { id } = useParams();

  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadCurrentUser();

    if (id) {
      loadUser(id);
    } else {
      loadMe();
    }
  }, [id]);

  async function loadCurrentUser() {
    const me = await getMe();
    setCurrentUser(me);
  }

  async function loadMe() {
    const data = await getMe();
    setUser(data);
  }

  async function loadUser(userId) {
    const data = await apiRequest(`/api/users/${userId}`);
    setUser(data);
  }

  if (!user) return <p>Loading...</p>;

  const isMe = currentUser?.id === user.id;

  return (
    <div>
      <h2>{user.name}'s Profile</h2>

      <p>{user.bio || "No bio yet."}</p>

      {user.avatar_url && (
        <img src={user.avatar_url} alt="avatar" />
      )}

      {isMe ? (
        <button>Edit Profile</button>
      ) : (
        <button>Follow</button>
      )}
    </div>
  );
}