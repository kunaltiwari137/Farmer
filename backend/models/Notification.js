const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    // Who receives this notification
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // The user this notification is about
    // Example:
    // Admin receives notification about Farmer Kunal
    // related_user_id = Kunal's User ID
    related_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Notification message
    message: {
      type: String,
      required: true,
    },

    // Notification type
    // Examples:
    // signup
    // approval
    // rejection
    // general
    type: {
      type: String,
      default: "general",
    },

    // Has the notification been opened/read?
    is_read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Notification",
  notificationSchema
);