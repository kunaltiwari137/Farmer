const express = require("express");

const router = express.Router();

const chatController = require("../controllers/chatController");

const authMiddleware = require("../middleware/authMiddleware");

router.post(
  "/start",
  authMiddleware,
  chatController.startConversation
);

router.get(
  "/conversations",
  authMiddleware,
  chatController.getMyConversations
);

router.post(
  "/message",
  authMiddleware,
  chatController.sendMessage
);

router.get(
  "/messages/:conversation_id",
  authMiddleware,
  chatController.getMessages
);

module.exports = router;