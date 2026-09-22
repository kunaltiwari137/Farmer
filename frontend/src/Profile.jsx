import { Link } from "react-router-dom";

function Profile({ user }) {
  if (!user) return null;

  return (
    <div className="max-w-md mx-auto mt-10">
      <p className="eyebrow mb-3">Account</p>
      <h2 className="text-3xl mb-8" style={{ color: "var(--mist)" }}>My Profile</h2>

      <div className="rounded-2xl p-7" style={{ background: "var(--soil-2)", border: "1px solid var(--line)" }}>
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-display"
            style={{ background: "var(--gold)", color: "var(--ink)" }}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-display" style={{ color: "var(--mist)" }}>{user.name}</p>
            <p className="text-sm uppercase tracking-wide" style={{ color: "var(--gold)" }}>{user.role}</p>
          </div>
        </div>

        <div className="space-y-3 text-sm" style={{ borderTop: "1px solid var(--line)", paddingTop: "1.2rem" }}>
          <div className="flex justify-between">
            <span style={{ color: "var(--mist-dim)" }}>Email</span>
            <span style={{ color: "var(--mist)" }}>{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: "var(--mist-dim)" }}>Account Type</span>
            <span style={{ color: "var(--mist)" }}>{user.role === "farmer" ? "Farmer" : "Buyer"}</span>
          </div>
        </div>

        <div className="mt-6 pt-6 flex flex-col gap-2" style={{ borderTop: "1px solid var(--line)" }}>
          {user.role === "buyer" && (
            <Link to="/buyer-profile" className="text-sm" style={{ color: "var(--gold)" }}>
              Edit Buyer Details →
            </Link>
          )}
          {user.role === "farmer" && (
            <Link to="/farmer-dashboard" className="text-sm" style={{ color: "var(--gold)" }}>
              Go to Farm Dashboard →
            </Link>
          )}
          {/* STEP 1: Sabke liye — role kuch bhi ho, password change kar sakein */}
          <Link to="/change-password" className="text-sm" style={{ color: "var(--gold)" }}>
            Change Password →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Profile;