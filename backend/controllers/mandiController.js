const MandiPrice = require("../models/MandiPrice");

exports.getAllMandiPrices = async (req, res) => {
  try {
    const prices = await MandiPrice.find().sort({ crop_name: 1 });
    res.json(prices);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch mandi prices" });
  }
};

exports.setMandiPrice = async (req, res) => {
  try {
    const { crop_name, category, price_per_kg, market_location } = req.body;
    if (!crop_name || !price_per_kg) {
      return res.status(400).json({ error: "crop_name and price_per_kg are required" });
    }

    // STEP 1: Agar us crop_name ka price pehle se hai, update karo; nahi to naya banao
    const existing = await MandiPrice.findOne({ crop_name });
    if (existing) {
      existing.price_per_kg = price_per_kg;
      existing.category = category || existing.category;
      existing.market_location = market_location || existing.market_location;
      await existing.save();
      return res.json({ message: "Mandi price updated" });
    }

    await MandiPrice.create({ crop_name, category, price_per_kg, market_location });
    res.status(201).json({ message: "Mandi price set" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to set mandi price" });
  }
};

exports.deleteMandiPrice = async (req, res) => {
  try {
    await MandiPrice.findByIdAndDelete(req.params.id);
    res.json({ message: "Mandi price removed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to remove" });
  }
};