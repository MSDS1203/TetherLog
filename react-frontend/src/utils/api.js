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