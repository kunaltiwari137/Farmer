import { useState } from "react";
import { Link } from "react-router-dom";
import NotificationBell from "./NotificationBell";

function Navbar({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  const linkStyle = "hover:text-[var(--gold)] transition-colors";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 py-4 sm:py-5"
         style={{
           background: "linear-gradient(to bottom, rgba(20,20,15,0.95), rgba(20,20,15,0.85))",
           backdropFilter: "blur(6px)",
         }}>
      <div className="flex items-center justify-between">
        <Link to="/" onClick={closeMenu} className="flex items-center gap-2 font-display text-lg sm:text-xl" style={{ color: "var(--mist)" }}>
          <span
            className="w-3 h-3 rounded-sm flex-shrink-0"
            style={{ background: "var(--crop-solid)", transform: "rotate(45deg)", boxShadow: "0 0 14px rgba(124,154,85,0.7)" }}
          ></span>
          AgriConnect
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm" style={{ color: "var(--mist-dim)" }}>
          <Link to="/" className={linkStyle}>Home</Link>

          {user && user.role === "buyer" && (
            <>
              <Link to="/place-order" className={linkStyle}>Place Order</Link>
              <Link to="/my-orders" className={linkStyle}>My Orders</Link>
            </>
          )}

          {user && user.role === "farmer" && (
            <>
              <Link to="/list-crop" className={linkStyle}>List a Crop</Link>
              <Link to="/farmer-dashboard" className={linkStyle}>My Farm Orders</Link>
            </>
          )}

          {user && user.role === "admin" && (
            <Link to="/admin" className={linkStyle}>Admin</Link>
          )}

          {user && <NotificationBell />}

          {user ? (
            <>
              {/* STEP 1: The greeting is now a clickable link to /profile, not just static text */}
              <Link
                to="/profile"
                className="flex items-center gap-2 hover:text-[var(--gold)] transition-colors"
                style={{ color: "var(--mist)" }}
              >
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-display"
                  style={{ background: "var(--gold)", color: "var(--ink)" }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </span>
                {user.name}
              </Link>
              <button
                onClick={onLogout}
                className="text-sm px-4 py-1.5 rounded-full border transition-all"
                style={{ borderColor: "var(--mist-dim)" }}
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="text-sm px-4 py-1.5 rounded-full border" style={{ borderColor: "var(--mist-dim)" }}>
              Login
            </Link>
          )}
        </div>

        <div className="flex md:hidden items-center gap-4">
          {user && <NotificationBell />}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-2xl leading-none"
            style={{ color: "var(--mist)" }}
            aria-label="Toggle menu"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          className="md:hidden mt-4 pb-4 flex flex-col gap-4 text-sm"
          style={{ borderTop: "1px solid var(--line)", paddingTop: "1rem", color: "var(--mist-dim)" }}
        >
          <Link to="/" onClick={closeMenu} className={linkStyle}>Home</Link>

          {user && user.role === "buyer" && (
            <>
              <Link to="/place-order" onClick={closeMenu} className={linkStyle}>Place Order</Link>
              <Link to="/my-orders" onClick={closeMenu} className={linkStyle}>My Orders</Link>
            </>
          )}

          {user && user.role === "farmer" && (
            <>
              <Link to="/list-crop" onClick={closeMenu} className={linkStyle}>List a Crop</Link>
              <Link to="/farmer-dashboard" onClick={closeMenu} className={linkStyle}>My Farm Orders</Link>
            </>
          )}

          {user && user.role === "admin" && (
            <Link to="/admin" onClick={closeMenu} className={linkStyle}>Admin</Link>
          )}

          {user ? (
            <>
              <Link to="/profile" onClick={closeMenu} className={linkStyle} style={{ color: "var(--mist)" }}>
                My Profile ({user.name})
              </Link>
              <button
                onClick={() => { onLogout(); closeMenu(); }}
                className="text-sm px-4 py-2 rounded-full border w-fit"
                style={{ borderColor: "var(--mist-dim)" }}
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" onClick={closeMenu} className="text-sm px-4 py-2 rounded-full border w-fit" style={{ borderColor: "var(--mist-dim)" }}>
              Login
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;