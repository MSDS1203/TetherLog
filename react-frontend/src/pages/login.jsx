import { useState } from "react";
import { saveToken } from "../utils/auth";
import { loginRequest } from "../utils/api";

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const toggleMode = () => {
    setIsRegister((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isRegister) {
      const data = await loginRequest(email, password);

      if (data?.token) {
        saveToken(data.token);
        window.location.href = "/dashboard";
      } else {
        alert(data?.error || "Login failed");
      }

    } else {
      if (!name.trim()) {
        alert("Name is required");
        return;
      }

      try {
        const res = await fetch("http://localhost:5000/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password })
        });

        const data = await res.json();

        if (res.ok) {
          alert("Account created! You can now log in.");
          setIsRegister(false);
          setName("");
          setPassword("");
        } else {
          alert(data.error || "Registration failed");
        }
      } catch (err) {
        alert("Server error");
      }
    }
  };

  return (
    <div>
      <h1>{isRegister ? "Sign Up" : "Login"}</h1>

      <form onSubmit={handleSubmit}>
        {isRegister && (
          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">
          {isRegister ? "Sign Up" : "Login"}
        </button>
      </form>

      <p
        onClick={toggleMode}
        style={{ cursor: "pointer", color: "blue" }}
      >
        {isRegister ? "Back to login" : "Sign up here"}
      </p>
    </div>
  );
}