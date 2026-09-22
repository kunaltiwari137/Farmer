const mongoose = require("mongoose");

const mandiPriceSchema = new mongoose.Schema({
  crop_name: { type: String, required: true },
  category: { type: String, enum: ["Vegetables", "Fruits", "Grains", "Dairy", "Spices", "Other"], default: "Other" },
  price_per_kg: { type: Number, required: true },
  market_location: { type: String, default: "General" },
}, { timestamps: true });

module.exports = mongoose.model("MandiPrice", mandiPriceSchema);