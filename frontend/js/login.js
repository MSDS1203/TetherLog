import { saveToken } from "./auth.js";
import { loginRequest } from "./api.js";

const form = document.getElementById("loginForm");
const toggle = document.getElementById("toggleMode");
const nameField = document.getElementById("nameField");
const submitBtn = document.getElementById("submitBtn");

let isRegister = false;

toggle.addEventListener("click", (e) => {
  e.preventDefault();

  isRegister = !isRegister;

  if (isRegister) {
    nameField.style.display = "block";
    submitBtn.textContent = "Sign Up";
    toggle.textContent = "Back to login";
  } else {
    nameField.style.display = "none";
    submitBtn.textContent = "Login";
    toggle.textContent = "Sign up here";
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = form.email.value;
  const password = form.password.value;

  if (!isRegister) {
    const res = await loginRequest(email, password);
    const data = await res.json();

    if (data.token) {
      saveToken(data.token);
      window.location.href = "dashboard.html";
    } else {
      alert(data.error || "Login failed");
    }

  } else {
    const name = nameField.value;

    if (!name) {
      alert("Name is required");
      return;
    }

    const res = await fetch("http://localhost:5000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (res.ok) {
      alert("Account created! You can now log in.");

      isRegister = false;
      nameField.style.display = "none";
      submitBtn.textContent = "Login";
      toggle.textContent = "Sign up here";
    } else {
      alert(data.error || "Registration failed");
    }
  }
});