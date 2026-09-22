const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, unique: true },
  amount: { type: Number, required: true },
  payment_status: { type: String, enum: ["pending", "held", "released", "refunded"], default: "pending" },
  transaction_id: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);