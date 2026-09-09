import { useState } from "react";
import axios from "axios";

function BuyerProfile() {
  const [companyName, setCompanyName] = useState("");
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const token = localStorage.getItem("token");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/buyers/profile",
        { company_name: companyName, location },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage(`Profile created! Buyer ID: ${response.data.buyer_id}`);
      setCompanyName("");
      setLocation("");

    } catch (err) {
      setError(err.response?.data?.error || "Failed to create profile");
    }
  };

  const inputStyle = { background: "var(--soil)", border: "1px solid var(--line)", color: "var(--mist)" };

  return (
    <div className="max-w-sm mx-auto mt-10">
      <p className="eyebrow mb-3">Buyer</p>
      <h2 className="text-3xl mb-6" style={{ color: "var(--mist)" }}>Complete Your Profile</h2>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl p-7"
        style={{ background: "var(--soil-2)", border: "1px solid var(--line)" }}
      >
        <label className="text-xs uppercase tracking-wide" style={{ color: "var(--mist-dim)" }}>Company / Business Name</label>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className="w-full p-3 mt-1 mb-4 rounded-lg outline-none"
          style={inputStyle}
          onFocus={(e) => e.target.style.borderColor = "var(--gold)"}
          onBlur={(e) => e.target.style.borderColor = "var(--line)"}
        />

        <label className="text-xs uppercase tracking-wide" style={{ color: "var(--mist-dim)" }}>Location</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full p-3 mt-1 mb-5 rounded-lg outline-none"
          style={inputStyle}
          onFocus={(e) => e.target.style.borderColor = "var(--gold)"}
          onBlur={(e) => e.target.style.borderColor = "var(--line)"}
        />

        {error && <p className="text-sm mb-4" style={{ color: "var(--clay)" }}>{error}</p>}
        {message && <p className="text-sm mb-4" style={{ color: "var(--crop-solid)" }}>{message}</p>}

        <button
          type="submit"
          className="w-full py-3 rounded-full font-semibold transition-transform hover:-translate-y-0.5"
          style={{ background: "var(--gold)", color: "var(--ink)" }}
        >
          Save Profile
        </button>
      </form>
    </div>
  );
}

export default BuyerProfile;