const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
  buyer_user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  farmer_user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  crop_id: { type: mongoose.Schema.Types.ObjectId, ref: "Crop" },
}, { timestamps: true });

conversationSchema.index({ buyer_user_id: 1, farmer_user_id: 1, crop_id: 1 }, { unique: true });

module.exports = mongoose.model("Conversation", conversationSchema);