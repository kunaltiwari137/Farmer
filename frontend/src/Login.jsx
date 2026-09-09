import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // STEP 1: A function from React Router that lets you navigate programmatically (not via a click)
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      onLoginSuccess(response.data.user);

      // STEP 2: Redirect to the homepage after a successful login
      navigate("/");

    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-10">
      <p className="eyebrow mb-3">Welcome back</p>
      <h2 className="text-3xl mb-6" style={{ color: "var(--mist)" }}>Login</h2>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl p-7"
        style={{ background: "var(--soil-2)", border: "1px solid var(--line)" }}
      >
        <label className="text-xs uppercase tracking-wide" style={{ color: "var(--mist-dim)" }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 mt-1 mb-4 rounded-lg outline-none transition-colors"
          style={{ background: "var(--soil)", border: "1px solid var(--line)", color: "var(--mist)" }}
          onFocus={(e) => e.target.style.borderColor = "var(--gold)"}
          onBlur={(e) => e.target.style.borderColor = "var(--line)"}
        />

        <label className="text-xs uppercase tracking-wide" style={{ color: "var(--mist-dim)" }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 mt-1 mb-5 rounded-lg outline-none transition-colors"
          style={{ background: "var(--soil)", border: "1px solid var(--line)", color: "var(--mist)" }}
          onFocus={(e) => e.target.style.borderColor = "var(--gold)"}
          onBlur={(e) => e.target.style.borderColor = "var(--line)"}
        />

        {error && <p className="text-sm mb-4" style={{ color: "var(--clay)" }}>{error}</p>}

        <button
          type="submit"
          className="w-full py-3 rounded-full font-semibold transition-transform hover:-translate-y-0.5"
          style={{ background: "var(--gold)", color: "var(--ink)" }}
        >
          Log In
        </button>
      </form>
    </div>
  );
}

export default Login;