import { getToken, logout } from "./auth.js";
import { getMe, apiFetch } from "./api.js";

// redirect if not logged in
const token = getToken();
if (!token) {
  window.location.href = "login.html";
}

// DOM elements
const userInfo = document.getElementById("userInfo");
const logoutBtn = document.getElementById("logoutBtn");
const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const resultsDiv = document.getElementById("results");

// load user info
async function loadUser() {
  try {
    const user = await getMe();

    userInfo.innerText =
      `Logged in as ${user.name || user.email || user.id} (${user.role})`;
  } catch (err) {
    console.error("Failed to load user:", err);
  }
}

loadUser();

// logout
logoutBtn.addEventListener("click", logout);

// search books
searchBtn.addEventListener("click", async () => {
  const query = searchInput.value.trim();

  if (!query) {
    alert("Enter a search term");
    return;
  }

  try {
    const books = await apiFetch(`/api/search?q=${query}`);

    resultsDiv.innerHTML = "";

    books.forEach(book => {
      const div = document.createElement("div");

      div.innerHTML = `
        <h3>${book.title}</h3>
        <p>${book.author || "Unknown author"}</p>
        ${
          book.cover_id
            ? `<img src="https://covers.openlibrary.org/b/id/${book.cover_id}-M.jpg" />`
            : ""
        }
        <hr/>
      `;

      resultsDiv.appendChild(div);
    });

  } catch (err) {
    console.error(err);
    alert("Search failed");
  }
});

searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    searchBtn.click();
  }
});