const express = require("express");

const router = express.Router();

const notificationController = require("../controllers/notificationController");

const authMiddleware = require("../middleware/authMiddleware");


// ==========================================
// GET MY NOTIFICATIONS
// ==========================================
router.get(
  "/",
  authMiddleware,
  notificationController.getMyNotifications
);


// ==========================================
// GET UNREAD COUNT
// ==========================================
router.get(
  "/unread-count",
  authMiddleware,
  notificationController.getUnreadCount
);


// ==========================================
// MARK ONE AS READ
// ==========================================
router.put(
  "/:notification_id/read",
  authMiddleware,
  notificationController.markAsRead
);


// ==========================================
// MARK ALL AS READ
// ==========================================
router.put(
  "/read-all",
  authMiddleware,
  notificationController.markAllAsRead
);


// ==========================================
// CREATE NOTIFICATION
// ==========================================
router.post(
  "/",
  authMiddleware,
  notificationController.createNotification
);


module.exports = router;