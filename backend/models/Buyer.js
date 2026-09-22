const mongoose = require("mongoose");

const buyerSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  company_name: { type: String },
  location: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("Buyer", buyerSchema);