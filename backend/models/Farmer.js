const mongoose = require("mongoose");

const farmerSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  village: { type: String },
  district: { type: String },
  state: { type: String },
  verified: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Farmer", farmerSchema);