const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Crop = require("../models/Crop");
const Farmer = require("../models/Farmer");
const { emitToUser } = require("../config/socket");

exports.startConversation = async (req, res) => {
  try {
    const { crop_id } = req.body;
    if (!crop_id) return res.status(400).json({ error: "crop_id is required" });

    const crop = await Crop.findById(crop_id);
    if (!crop) return res.status(404).json({ error: "Crop not found" });

    const farmer = await Farmer.findById(crop.farmer_id);
    if (!farmer) return res.status(404).json({ error: "Farmer not found" });

    const buyer_user_id = req.user.user_id;
    const farmer_user_id = farmer.user_id;

    if (buyer_user_id.toString() === farmer_user_id.toString()) {
      return res.status(400).json({ error: "You cannot chat with yourself" });
    }

    let conversation = await Conversation.findOne({ buyer_user_id, farmer_user_id, crop_id });
    if (!conversation) {
      conversation = await Conversation.create({ buyer_user_id, farmer_user_id, crop_id });
    }

    res.json(conversation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to start conversation" });
  }
};

exports.getMyConversations = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const conversations = await Conversation.find({
      $or: [{ buyer_user_id: userId }, { farmer_user_id: userId }],
    })
      .populate("buyer_user_id", "name")
      .populate("farmer_user_id", "name")
      .populate("crop_id", "crop_name image_url")
      .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { conversation_id, text } = req.body;
    if (!conversation_id || !text) {
      return res.status(400).json({ error: "conversation_id and text are required" });
    }

    const conversation = await Conversation.findById(conversation_id);
    if (!conversation) return res.status(404).json({ error: "Conversation not found" });

    const userId = req.user.user_id.toString();
    if (conversation.buyer_user_id.toString() !== userId && conversation.farmer_user_id.toString() !== userId) {
      return res.status(403).json({ error: "You are not part of this conversation" });
    }

    const message = await Message.create({
      conversation_id,
      sender_id: req.user.user_id,
      text,
    });

    conversation.updatedAt = new Date();
    await conversation.save();

    // STEP 1: Real-time — dusre banda ko turant message bhej do, agar woh online hai
    const receiverId = conversation.buyer_user_id.toString() === userId
      ? conversation.farmer_user_id
      : conversation.buyer_user_id;
    emitToUser(receiverId, "new_message", message);

    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to send message" });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { conversation_id } = req.params;

    const conversation = await Conversation.findById(conversation_id);
    if (!conversation) return res.status(404).json({ error: "Conversation not found" });

    const userId = req.user.user_id.toString();
    if (conversation.buyer_user_id.toString() !== userId && conversation.farmer_user_id.toString() !== userId) {
      return res.status(403).json({ error: "You are not part of this conversation" });
    }

    const messages = await Message.find({ conversation_id }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};