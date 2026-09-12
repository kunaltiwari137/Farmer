import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [googleRole, setGoogleRole] = useState("buyer");

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
      navigate("/");

    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    try {
      const response = await axios.post("http://localhost:5000/api/auth/google", {
        credential: credentialResponse.credential,
        role: googleRole,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      onLoginSuccess(response.data.user);
      navigate("/");

    } catch (err) {
      setError(err.response?.data?.error || "Google sign-in failed");
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-10">
      <p className="eyebrow mb-3">Welcome back</p>
      <h2 className="text-3xl mb-6" style={{ color: "var(--mist)" }}>Login</h2>

      <div
        className="rounded-2xl p-7"
        style={{ background: "var(--soil-2)", border: "1px solid var(--line)" }}
      >
        <label className="text-xs uppercase tracking-wide" style={{ color: "var(--mist-dim)" }}>
          If signing up with Google, I am a:
        </label>
        <select
          value={googleRole}
          onChange={(e) => setGoogleRole(e.target.value)}
          className="w-full p-2 mt-1 mb-4 rounded-lg"
          style={{ background: "var(--soil)", border: "1px solid var(--line)", color: "var(--mist)" }}
        >
          <option value="buyer">Buyer</option>
          <option value="farmer">Farmer</option>
        </select>

        <div className="mb-5 flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError("Google sign-in failed")}
          />
        </div>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px" style={{ background: "var(--line)" }}></div>
          <span className="text-xs" style={{ color: "var(--mist-dim)" }}>OR</span>
          <div className="flex-1 h-px" style={{ background: "var(--line)" }}></div>
        </div>

        <form onSubmit={handleSubmit}>
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

        <p className="text-sm text-center mt-4" style={{ color: "var(--mist-dim)" }}>
          Don't have an account?{" "}
          <Link to="/signup" style={{ color: "var(--gold)" }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;