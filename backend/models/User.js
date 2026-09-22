const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  phone: { type: String },
  role: { type: String, enum: ["farmer", "buyer", "admin"], required: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  otp_code: { type: String },
  otp_expiry: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);