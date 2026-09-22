import {
  useState,
  useEffect,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import socket from "./socket";

function NotificationBell() {
  const [notifications, setNotifications] =
    useState([]);

  const [isOpen, setIsOpen] =
    useState(false);

  const dropdownRef = useRef(null);

  const navigate = useNavigate();

  const token =
    localStorage.getItem("token");

  // ==========================================
  // FETCH NOTIFICATIONS
  // ==========================================

  const fetchNotifications = () => {
    if (!token) return;

    axios
      .get(
        "http://localhost:5000/api/notifications",
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      )
      .then((res) => {
        setNotifications(res.data);
      })
      .catch((err) =>
        console.error(err)
      );
  };

  // ==========================================
  // INITIAL FETCH + REAL-TIME NOTIFICATIONS
  // ==========================================

  useEffect(() => {
    fetchNotifications();

    // Real-time notification
    const handleNewNotification =
      (notification) => {
        setNotifications((prev) => [
          notification,
          ...prev,
        ]);
      };

    socket.on(
      "new_notification",
      handleNewNotification
    );

    return () => {
      socket.off(
        "new_notification",
        handleNewNotification
      );
    };
  }, []);

  // ==========================================
  // CLICK OUTSIDE
  // ==========================================

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(
          e.target
        )
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
  }, []);

  // ==========================================
  // UNREAD COUNT
  // ==========================================

  const unreadCount =
    notifications.filter(
      (n) => !n.is_read
    ).length;

  // ==========================================
  // MARK ALL AS READ
  // ==========================================

  const handleMarkAllRead = async () => {
    try {
      await axios.put(
        "http://localhost:5000/api/notifications/read-all",
        {},
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================
  // GET NAVIGATION PATH
  // ==========================================

  const getNotificationPath = (
    notification
  ) => {
    switch (notification.type) {

      // ----------------------------------------
      // FARMER RECEIVED BULK REQUEST
      // ----------------------------------------

      case "bulk_request":
        return "/bulk-requests";

      // ----------------------------------------
      // BUYER RECEIVED FARMER OFFER
      // ----------------------------------------

      case "bulk_offer":
        return "/my-bulk-requests";

      // ----------------------------------------
      // NORMAL ORDER
      // ----------------------------------------

      case "order":
        return "/farmer-dashboard";

      // ----------------------------------------
      // STOCK ALERT
      // ----------------------------------------

      case "stock":
        return "/farmer-dashboard";

      // ----------------------------------------
      // BULK ORDER
      // ----------------------------------------

      case "bulk_order":
        return "/my-orders";

      // ----------------------------------------
      // DEFAULT
      // ----------------------------------------

      default:
        return null;
    }
  };

  // ==========================================
  // HANDLE ONE NOTIFICATION
  // ==========================================

  const handleNotificationClick =
    async (notification) => {
      try {
        // --------------------------------------
        // Mark as read
        // --------------------------------------

        if (!notification.is_read) {
          await axios.put(
            `http://localhost:5000/api/notifications/${notification._id}/read`,
            {},
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

          // Update locally immediately
          setNotifications((prev) =>
            prev.map((item) =>
              item._id === notification._id
                ? {
                    ...item,
                    is_read: true,
                  }
                : item
            )
          );
        }

        // --------------------------------------
        // Find destination
        // --------------------------------------

        const destination =
          getNotificationPath(
            notification
          );

        // --------------------------------------
        // Close dropdown
        // --------------------------------------

        setIsOpen(false);

        // --------------------------------------
        // Navigate
        // --------------------------------------

        if (destination) {
          navigate(destination);
        }

      } catch (err) {
        console.error(
          "Notification click error:",
          err
        );
      }
    };

  // ==========================================
  // NO TOKEN
  // ==========================================

  if (!token) return null;

  // ==========================================
  // UI
  // ==========================================

  return (
    <div
      className="relative"
      ref={dropdownRef}
    >

      {/* ======================================
          NOTIFICATION BUTTON
      ====================================== */}

      <button
        onClick={() =>
          setIsOpen(!isOpen)
        }
        className="relative text-lg"
        style={{
          color:
            "var(--mist-dim)",
        }}
      >
        🔔

        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 text-[10px] w-4 h-4 rounded-full flex items-center justify-center"
            style={{
              background:
                "var(--clay)",
              color:
                "var(--mist)",
            }}
          >
            {unreadCount > 9
              ? "9+"
              : unreadCount}
          </span>
        )}
      </button>

      {/* ======================================
          NOTIFICATION DROPDOWN
      ====================================== */}

      {isOpen && (
        <div
          className="absolute right-0 mt-3 w-72 sm:w-80 rounded-2xl overflow-hidden z-50"
          style={{
            background:
              "var(--soil-2)",
            border:
              "1px solid var(--line)",
          }}
        >

          {/* ==================================
              HEADER
          ================================== */}

          <div
            className="flex justify-between items-center p-3"
            style={{
              borderBottom:
                "1px solid var(--line)",
            }}
          >
            <span
              className="text-sm font-semibold"
              style={{
                color:
                  "var(--mist)",
              }}
            >
              Notifications
            </span>

            {unreadCount > 0 && (
              <button
                onClick={
                  handleMarkAllRead
                }
                className="text-xs"
                style={{
                  color:
                    "var(--gold)",
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* ==================================
              NOTIFICATION LIST
          ================================== */}

          <div className="max-h-80 overflow-y-auto">

            {notifications.length ===
              0 && (
              <p
                className="text-sm p-4 text-center"
                style={{
                  color:
                    "var(--mist-dim)",
                }}
              >
                No notifications yet.
              </p>
            )}

            {notifications.map(
              (n) => (
                <div
                  key={n._id}
                  onClick={() =>
                    handleNotificationClick(
                      n
                    )
                  }
                  className="p-3 text-sm cursor-pointer hover:bg-[rgba(217,164,65,0.08)] transition-colors"
                  style={{
                    borderBottom:
                      "1px solid var(--line)",

                    background:
                      n.is_read
                        ? "transparent"
                        : "rgba(217,164,65,0.06)",

                    color:
                      n.is_read
                        ? "var(--mist-dim)"
                        : "var(--mist)",
                  }}
                >

                  {/* MESSAGE */}

                  <div>
                    {n.message}
                  </div>

                  {/* TIME */}

                  <p
                    className="text-[10px] mt-1"
                    style={{
                      color:
                        "var(--line)",
                    }}
                  >
                    {new Date(
                      n.createdAt
                    ).toLocaleString()}
                  </p>

                </div>
              )
            )}

          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;