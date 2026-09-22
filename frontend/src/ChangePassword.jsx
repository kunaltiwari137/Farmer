import { useState } from "react";
import axios from "axios";

function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    // STEP 1: Frontend pe hi confirm karo ki dono naye password match karte hain
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    const token = localStorage.getItem("token");

    try {
      await axios.put(
        "http://localhost:5000/api/auth/change-password",
        { current_password: currentPassword, new_password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

    } catch (err) {
      setError(err.response?.data?.error || "Failed to update password");
    }
  };

  const inputStyle = { background: "var(--soil)", border: "1px solid var(--line)", color: "var(--mist)" };

  return (
    <div className="max-w-sm mx-auto mt-10">
      <p className="eyebrow mb-3">Account</p>
      <h2 className="text-3xl mb-6" style={{ color: "var(--mist)" }}>Change Password</h2>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl p-7"
        style={{ background: "var(--soil-2)", border: "1px solid var(--line)" }}
      >
        <label className="text-xs uppercase tracking-wide" style={{ color: "var(--mist-dim)" }}>Current Password</label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full p-3 mt-1 mb-4 rounded-lg outline-none"
          style={inputStyle}
        />

        <label className="text-xs uppercase tracking-wide" style={{ color: "var(--mist-dim)" }}>New Password</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full p-3 mt-1 mb-4 rounded-lg outline-none"
          style={inputStyle}
        />

        <label className="text-xs uppercase tracking-wide" style={{ color: "var(--mist-dim)" }}>Confirm New Password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full p-3 mt-1 mb-5 rounded-lg outline-none"
          style={inputStyle}
        />

        {error && <p className="text-sm mb-4" style={{ color: "var(--clay)" }}>{error}</p>}
        {message && <p className="text-sm mb-4" style={{ color: "var(--crop-solid)" }}>{message}</p>}

        <button
          type="submit"
          className="w-full py-3 rounded-full font-semibold transition-transform hover:-translate-y-0.5"
          style={{ background: "var(--gold)", color: "var(--ink)" }}
        >
          Update Password
        </button>
      </form>
    </div>
  );
}

export default ChangePassword;