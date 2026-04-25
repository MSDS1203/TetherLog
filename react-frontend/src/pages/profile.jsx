import { useEffect, useState } from "react";
import { getMe, apiRequest, getUserGoals, getUserShelves } from "../utils/api";
import { useParams, Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import "./Profile.css";

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activity, setActivity] = useState([]);
  
  const [wantToRead, setWantToRead] = useState([]);
  const [currentlyReading, setCurrentlyReading] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [activeTab, setActiveTab] = useState("activity");
  const [shelves, setShelves] = useState([]);
  const [goalSummary, setGoalSummary] = useState({ goals: [], streak: { current: 0, longest: 0 } });

  const [stats, setStats] = useState({
    followers: 0,
    following: 0,
    books: 0,
  });

  useEffect(() => {
    loadCurrentUser();
    if (id) {
      loadUser(id);
      loadActivity(id);
      loadFollowStatus(id);
      loadStats(id);
      loadReadingLists(id);
      loadShelves(id);
      loadGoals(id);
    }
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
    setActivity(data.slice(0, 5));
  }

  async function loadStats(userId) {
    const data = await apiRequest(`/api/users/${userId}/stats`);
    setStats(data);
  }

  async function loadReadingLists(userId) {
    try {
      const allBooks = await apiRequest(`/api/reading-status/user/${userId}`);
      setWantToRead(allBooks.filter(book => book.status === "want_to_read"));
      setCurrentlyReading(allBooks.filter(book => book.status === "reading"));
      setCompleted(allBooks.filter(book => book.status === "completed"));
    } catch (err) {
      console.error("Failed to load reading lists:", err);
    }
  }

  async function loadShelves(userId) {
    try {
      const data = await getUserShelves(userId);
      setShelves(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load shelves:", err);
    }
  }

  async function loadGoals(userId) {
    try {
      const data = await getUserGoals(userId);
      setGoalSummary(data);
    } catch (err) {
      console.error("Failed to load goals:", err);
    }
  }

  function renderStars(rating) {
    if (!rating) return null;
    return `${"★".repeat(Number(rating))}${"☆".repeat(5 - Number(rating))}`;
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

  if (!user) return <p className="loading">Loading...</p>;

  const isMe = currentUser?.id === user.id;

  return (
    <div className="profile-container">
      
      <div className="profile-header">
        <h2 className="profile-name">{user.name}</h2>
        <p className="profile-bio">{user.bio || "No bio yet."}</p>

        {user.avatar_url && (
          <img
            src={user.avatar_url}
            alt="avatar"
            className="profile-avatar"
          />
        )}
      </div>

      <div className="stats-bar">
        <Link to={`/profile/${id}/followers`} className="stat-item">
          <div className="stat-number">{stats.followers}</div>
          <div className="stat-label">Followers</div>
        </Link>

        <Link to={`/profile/${id}/following`} className="stat-item">
          <div className="stat-number">{stats.following}</div>
          <div className="stat-label">Following</div>
        </Link>

        <div className="stat-item">
          <div className="stat-number">{stats.books}</div>
          <div className="stat-label">Books</div>
        </div>
      </div>

      <div className="profile-actions">
        {isMe ? (
          <button 
            onClick={() => navigate(`/profile/${user.id}/edit`)}
            className="edit-button"
          >
            Edit Profile
          </button>
        ) : (
          <button 
            onClick={toggleFollow}
            className={`follow-button ${isFollowing ? "following-button" : ""}`}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        )}
      </div>

      <div style={{ marginBottom: "20px", display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        {goalSummary.goals.slice(0, 2).map((goal) => (
          <div key={goal.id} style={{ border: "1px solid #dbe4ea", borderRadius: "10px", padding: "14px", background: "#fff" }}>
            <div style={{ fontWeight: 600, marginBottom: "6px" }}>
              {goal.period_type === "yearly" ? `${goal.year} Goal` : `${goal.month}/${goal.year} Goal`}
            </div>
            <div style={{ color: "#555" }}>{goal.progress} of {goal.target_count} books</div>
            <div style={{ marginTop: "8px", height: "8px", borderRadius: "999px", background: "#edf2f7", overflow: "hidden" }}>
              <div style={{ width: `${goal.percentComplete}%`, height: "100%", background: "#2b6cb0" }} />
            </div>
          </div>
        ))}
        <div style={{ border: "1px solid #dbe4ea", borderRadius: "10px", padding: "14px", background: "#fff" }}>
          <div style={{ fontWeight: 600, marginBottom: "6px" }}>Reading Streak</div>
          <div style={{ color: "#555" }}>Current: {goalSummary.streak.current} days</div>
          <div style={{ color: "#555" }}>Longest: {goalSummary.streak.longest} days</div>
        </div>
      </div>

      <div className="tabs">
        <button
          onClick={() => setActiveTab("activity")}
          className={`tab ${activeTab === "activity" ? "tab-active" : "tab-inactive"}`}
        >
          Recent Activity
        </button>
        <button
          onClick={() => setActiveTab("wantToRead")}
          className={`tab ${activeTab === "wantToRead" ? "tab-active" : "tab-inactive"}`}
        >
          Want to Read <span className="tab-count">({wantToRead.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("reading")}
          className={`tab ${activeTab === "reading" ? "tab-active" : "tab-inactive"}`}
        >
          Currently Reading <span className="tab-count">({currentlyReading.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`tab ${activeTab === "completed" ? "tab-active" : "tab-inactive"}`}
        >
          Completed <span className="tab-count">({completed.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("shelves")}
          className={`tab ${activeTab === "shelves" ? "tab-active" : "tab-inactive"}`}
        >
          Shelves <span className="tab-count">({shelves.length})</span>
        </button>
      </div>

      <div className="tab-content">
        {activeTab === "activity" && (
          <div className="activity-list">
            {activity.length === 0 ? (
              <p className="empty-state">No activity yet.</p>
            ) : (
              activity.map((item) => (
                <div key={item.id} className="activity-item">
                  <p className="activity-title">
                    Reading <b>{item.book_title}</b>
                  </p>
                  <p className="activity-page">Page: {item.page_reached}</p>
                  {item.note && <p className="activity-note">"{item.note}"</p>}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "wantToRead" && (
          <div className="books-list">
            {wantToRead.length === 0 ? (
              <p className="empty-state">No books in Want to Read list.</p>
            ) : (
              wantToRead.map((book) => (
                <Link to={`/books/${book.book_id}`} key={book.id} className="book-card">
                  {book.cover_url ? (
                    <img src={book.cover_url} alt={book.title} className="book-cover" />
                  ) : (
                    <div className="book-cover-placeholder">No cover</div>
                  )}
                  <div className="book-info">
                    <div className="book-title">{book.title}</div>
                    <p className="book-author">{book.author}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {activeTab === "reading" && (
          <div className="books-list">
            {currentlyReading.length === 0 ? (
              <p className="empty-state">No books currently reading.</p>
            ) : (
              currentlyReading.map((book) => (
                <div key={book.id} className="book-card">
                  <Link to={`/books/${book.book_id}`} style={{ display: "flex", gap: "15px", textDecoration: "none", color: "inherit", flex: 1 }}>
                    {book.cover_url ? (
                      <img src={book.cover_url} alt={book.title} className="book-cover" />
                    ) : (
                      <div className="book-cover-placeholder">No cover</div>
                    )}
                    <div className="book-info">
                      <div className="book-title">{book.title}</div>
                      <p className="book-author">{book.author}</p>
                      {book.current_page > 0 && (
                        <p className="book-progress">
                          Page {book.current_page} of {book.total_pages || "?"}
                        </p>
                      )}
                    </div>
                  </Link>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/update-progress/${book.book_id}`);
                    }}
                    style={{ 
                      marginLeft: "auto", 
                      padding: "5px 10px", 
                      fontSize: "12px",
                      backgroundColor: "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      alignSelf: "center"
                    }}
                  >
                    Update Progress
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "completed" && (
          <div className="books-list">
            {completed.length === 0 ? (
              <p className="empty-state">No completed books yet.</p>
            ) : (
              completed.map((book) => (
                <Link to={`/books/${book.book_id}`} key={book.id} className="book-card">
                  {book.cover_url ? (
                    <img src={book.cover_url} alt={book.title} className="book-cover" />
                  ) : (
                    <div className="book-cover-placeholder">No cover</div>
                  )}
                  <div className="book-info">
                    <div className="book-title">{book.title}</div>
                    <p className="book-author">{book.author}</p>
                    {book.rating && (
                      <p className="book-rating">
                        Rating: {renderStars(book.rating)}
                      </p>
                    )}
                    {book.review && (
                      <p className="book-progress" style={{ marginTop: "6px" }}>
                        {book.review}
                      </p>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {activeTab === "shelves" && (
          <div className="books-list" style={{ display: "grid", gap: "14px" }}>
            {shelves.length === 0 ? (
              <p className="empty-state">No shelves created yet.</p>
            ) : (
              shelves.map((shelf) => (
                <div key={shelf.id} className="activity-item">
                  <p className="activity-title">
                    <b>{shelf.name}</b>
                  </p>
                  {shelf.description && <p className="activity-note">{shelf.description}</p>}
                  {shelf.books.length === 0 ? (
                    <p className="empty-state" style={{ marginTop: "10px" }}>No books on this shelf.</p>
                  ) : (
                    <div style={{ display: "grid", gap: "10px", marginTop: "10px" }}>
                      {shelf.books.slice(0, 4).map((book) => (
                        <Link to={`/books/${book.id}`} key={`${shelf.id}-${book.id}`} className="book-card">
                          {book.cover_url ? (
                            <img src={book.cover_url} alt={book.title} className="book-cover" />
                          ) : (
                            <div className="book-cover-placeholder">No cover</div>
                          )}
                          <div className="book-info">
                            <div className="book-title">{book.title}</div>
                            <p className="book-author">{book.author}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}