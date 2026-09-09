import { useState, useEffect, useRef } from "react";
import axios from "axios";

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const token = localStorage.getItem("token");

  const fetchNotifications = () => {
    if (!token) return;
    axios.get("http://localhost:5000/api/notifications", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => setNotifications(res.data))
      .catch((err) => console.error(err));
  };

  // STEP 1: Fetch on load, then poll every 15 seconds for new ones
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  // STEP 2: Close the dropdown if the user clicks anywhere outside it
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAllRead = async () => {
    try {
      await axios.put(
        "http://localhost:5000/api/notifications/read-all",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkOneRead = async (id) => {
    try {
      await axios.put(
        `http://localhost:5000/api/notifications/${id}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  if (!token) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-lg"
        style={{ color: "var(--mist-dim)" }}
      >
        🔔
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 text-[10px] w-4 h-4 rounded-full flex items-center justify-center"
            style={{ background: "var(--clay)", color: "var(--mist)" }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-3 w-72 sm:w-80 rounded-2xl overflow-hidden z-50"
          style={{ background: "var(--soil-2)", border: "1px solid var(--line)" }}
        >
          <div className="flex justify-between items-center p-3" style={{ borderBottom: "1px solid var(--line)" }}>
            <span className="text-sm font-semibold" style={{ color: "var(--mist)" }}>Notifications</span>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs" style={{ color: "var(--gold)" }}>
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="text-sm p-4 text-center" style={{ color: "var(--mist-dim)" }}>
                No notifications yet.
              </p>
            )}

            {notifications.map((n) => (
              <div
                key={n.notification_id}
                onClick={() => !n.is_read && handleMarkOneRead(n.notification_id)}
                className="p-3 text-sm cursor-pointer"
                style={{
                  borderBottom: "1px solid var(--line)",
                  background: n.is_read ? "transparent" : "rgba(217,164,65,0.06)",
                  color: n.is_read ? "var(--mist-dim)" : "var(--mist)",
                }}
              >
                {n.message}
                <p className="text-[10px] mt-1" style={{ color: "var(--line)" }}>
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;