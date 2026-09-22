const Notification = require("../models/Notification");
const { emitToUser } = require("../config/socket");

// ==========================================
// CREATE NOTIFICATION
// Used internally by backend controllers
// ==========================================
exports.createNotification = async (
  userId,
  message,
  type = "general",
  relatedUserId = null
) => {
  try {
    const notification = await Notification.create({
      user_id: userId,
      related_user_id: relatedUserId,
      message,
      type,
    });

    // Send real-time notification if user is online
    emitToUser(
      userId,
      "new_notification",
      notification
    );

    return notification;

  } catch (error) {
    console.error(
      "Failed to create notification:",
      error
    );

    return null;
  }
};


// ==========================================
// GET MY NOTIFICATIONS
// ==========================================
exports.getMyNotifications = async (req, res) => {
  try {

    const notifications =
      await Notification.find({
        user_id: req.user.user_id,
      })
        .populate(
          "related_user_id",
          "name email role status"
        )
        .sort({ createdAt: -1 })
        .limit(20);

    res.json(notifications);

  } catch (error) {

    console.error(
      "Get notifications error:",
      error
    );

    res.status(500).json({
      error: "Failed to fetch notifications",
    });
  }
};


// ==========================================
// GET UNREAD COUNT
// ==========================================
exports.getUnreadCount = async (req, res) => {
  try {

    const count =
      await Notification.countDocuments({
        user_id: req.user.user_id,
        is_read: false,
      });

    res.json({
      count,
    });

  } catch (error) {

    console.error(
      "Get unread count error:",
      error
    );

    res.status(500).json({
      error: "Failed to fetch unread notification count",
    });
  }
};


// ==========================================
// MARK ONE NOTIFICATION AS READ
// ==========================================
exports.markAsRead = async (req, res) => {
  try {

    const { notification_id } = req.params;

    const notification =
      await Notification.findOneAndUpdate(
        {
          _id: notification_id,
          user_id: req.user.user_id,
        },
        {
          is_read: true,
        },
        {
          new: true,
        }
      );

    if (!notification) {
      return res.status(404).json({
        error: "Notification not found",
      });
    }

    res.json({
      message: "Marked as read",
      notification,
    });

  } catch (error) {

    console.error(
      "Mark notification read error:",
      error
    );

    res.status(500).json({
      error: "Failed to update notification",
    });
  }
};


// ==========================================
// MARK ALL NOTIFICATIONS AS READ
// ==========================================
exports.markAllAsRead = async (req, res) => {
  try {

    await Notification.updateMany(
      {
        user_id: req.user.user_id,
        is_read: false,
      },
      {
        is_read: true,
      }
    );

    res.json({
      message: "All notifications marked as read",
    });

  } catch (error) {

    console.error(
      "Mark all notifications read error:",
      error
    );

    res.status(500).json({
      error: "Failed to update notifications",
    });
  }
};