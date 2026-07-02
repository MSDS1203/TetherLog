const BASE_URL = "http://localhost:5000";

export async function loginRequest(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  return res.json();
}

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(BASE_URL + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` })
    }
  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/";
    return;
  }

  return res.json();
}

export function getMe() {
  return apiRequest("/api/auth/me");
}

export function searchBooks(query) {
  return apiRequest(`/api/auth/search?q=${query}`);
}

export function getFeed() {
  return apiRequest("/api/feed");
}

export function getReadingStatus(bookId) {
  return apiRequest(`/api/reading-status/${bookId}`);
}

export function saveReadingStatus(payload) {
  return apiRequest("/api/reading-status", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getBookReviews(bookId) {
  return apiRequest(`/api/reading-status/${bookId}/reviews`);
}

export function getMyShelves(bookId) {
  const query = bookId ? `?bookId=${encodeURIComponent(bookId)}` : "";
  return apiRequest(`/api/shelves/my${query}`);
}

export function getUserShelves(userId) {
  return apiRequest(`/api/shelves/user/${userId}`);
}

export function createShelf(payload) {
  return apiRequest("/api/shelves", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function addBookToShelf(shelfId, bookId) {
  return apiRequest(`/api/shelves/${shelfId}/books`, {
    method: "POST",
    body: JSON.stringify({ book_id: bookId })
  });
}

export function removeBookFromShelf(shelfId, bookId) {
  return apiRequest(`/api/shelves/${shelfId}/books/${bookId}`, {
    method: "DELETE"
  });
}

export function getMyGoals() {
  return apiRequest("/api/goals/me");
}

export function getUserGoals(userId) {
  return apiRequest(`/api/goals/user/${userId}`);
}

export function saveGoal(payload) {
  return apiRequest("/api/goals", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}