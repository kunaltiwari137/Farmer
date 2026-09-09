const pool = require("../config/db");

// STEP 1: A reusable internal helper — NOT an API route, just a function other controllers can call
// This is exported so other controller files can import and use it directly
exports.createNotification = async (userId, message, type = "general") => {
  try {
    await pool.query(
      "INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)",
      [userId, message, type]
    );
  } catch (error) {
    // STEP 2: If a notification fails to insert, log it but don't crash the main action
    console.error("Failed to create notification:", error);
  }
};

// STEP 3: Get all notifications for the logged-in user, newest first
exports.getMyNotifications = async (req, res) => {
  try {
    const [notifications] = await pool.query(
      "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20",
      [req.user.user_id]
    );
    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

// STEP 4: Mark a specific notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(
      "UPDATE notifications SET is_read = TRUE WHERE notification_id = ? AND user_id = ?",
      [id, req.user.user_id]
    );
    res.json({ message: "Marked as read" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update notification" });
  }
};

// STEP 5: Mark ALL of the user's notifications as read at once
exports.markAllAsRead = async (req, res) => {
  try {
    await pool.query(
      "UPDATE notifications SET is_read = TRUE WHERE user_id = ?",
      [req.user.user_id]
    );
    res.json({ message: "All marked as read" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update notifications" });
  }
};