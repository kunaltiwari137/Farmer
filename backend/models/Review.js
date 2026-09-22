const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  buyer_id: { type: mongoose.Schema.Types.ObjectId, ref: "Buyer", required: true },
  farmer_id: { type: mongoose.Schema.Types.ObjectId, ref: "Farmer", required: true },
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, unique: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("Review", reviewSchema);