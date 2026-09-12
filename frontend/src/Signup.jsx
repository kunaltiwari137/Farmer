import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

function Signup({ onLoginSuccess }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("buyer");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      // STEP 1: Create the account
      await axios.post("http://localhost:5000/api/auth/signup", {
        name, email, password, phone, role
      });

      // STEP 2: Immediately log them in after successful signup, for a smooth experience
      const loginResponse = await axios.post("http://localhost:5000/api/auth/login", {
        email, password
      });

      localStorage.setItem("token", loginResponse.data.token);
      localStorage.setItem("user", JSON.stringify(loginResponse.data.user));
      onLoginSuccess(loginResponse.data.user);

      navigate("/");

    } catch (err) {
      setError(err.response?.data?.error || "Signup failed");
    }
  };

  const inputStyle = { background: "var(--soil)", border: "1px solid var(--line)", color: "var(--mist)" };

  return (
    <div className="max-w-sm mx-auto mt-10">
      <p className="eyebrow mb-3">Join AgriConnect</p>
      <h2 className="text-3xl mb-6" style={{ color: "var(--mist)" }}>Create Account</h2>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl p-7"
        style={{ background: "var(--soil-2)", border: "1px solid var(--line)" }}
      >
        <label className="text-xs uppercase tracking-wide" style={{ color: "var(--mist-dim)" }}>Full Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 mt-1 mb-4 rounded-lg outline-none"
          style={inputStyle}
          onFocus={(e) => e.target.style.borderColor = "var(--gold)"}
          onBlur={(e) => e.target.style.borderColor = "var(--line)"}
        />

        <label className="text-xs uppercase tracking-wide" style={{ color: "var(--mist-dim)" }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 mt-1 mb-4 rounded-lg outline-none"
          style={inputStyle}
          onFocus={(e) => e.target.style.borderColor = "var(--gold)"}
          onBlur={(e) => e.target.style.borderColor = "var(--line)"}
        />

        <label className="text-xs uppercase tracking-wide" style={{ color: "var(--mist-dim)" }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 mt-1 mb-4 rounded-lg outline-none"
          style={inputStyle}
          onFocus={(e) => e.target.style.borderColor = "var(--gold)"}
          onBlur={(e) => e.target.style.borderColor = "var(--line)"}
        />

        <label className="text-xs uppercase tracking-wide" style={{ color: "var(--mist-dim)" }}>Phone (optional)</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full p-3 mt-1 mb-4 rounded-lg outline-none"
          style={inputStyle}
          onFocus={(e) => e.target.style.borderColor = "var(--gold)"}
          onBlur={(e) => e.target.style.borderColor = "var(--line)"}
        />

        <label className="text-xs uppercase tracking-wide" style={{ color: "var(--mist-dim)" }}>I am a</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full p-3 mt-1 mb-5 rounded-lg outline-none"
          style={inputStyle}
        >
          <option value="buyer">Buyer</option>
          <option value="farmer">Farmer</option>
        </select>

        {error && <p className="text-sm mb-4" style={{ color: "var(--clay)" }}>{error}</p>}
        {success && <p className="text-sm mb-4" style={{ color: "var(--crop-solid)" }}>{success}</p>}

        <button
          type="submit"
          className="w-full py-3 rounded-full font-semibold transition-transform hover:-translate-y-0.5"
          style={{ background: "var(--gold)", color: "var(--ink)" }}
        >
          Sign Up
        </button>

        <p className="text-sm text-center mt-4" style={{ color: "var(--mist-dim)" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--gold)" }}>Log in</Link>
        </p>
      </form>
    </div>
  );
}

export default Signup;