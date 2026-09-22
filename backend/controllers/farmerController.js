const Farmer = require("../models/Farmer");
const User = require("../models/User");
const Crop = require("../models/Crop");
const Review = require("../models/Review");

exports.getFarmerProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const farmer = await Farmer.findById(id);
    if (!farmer) return res.status(404).json({ error: "Farmer not found" });

    const user = await User.findById(farmer.user_id).select("name email");
    const crops = await Crop.find({ farmer_id: farmer._id, status: "available" });

    const reviews = await Review.find({ farmer_id: farmer._id })
      .populate("buyer_id", "company_name")
      .sort({ createdAt: -1 });

    const avgResult = await Review.aggregate([
      { $match: { farmer_id: farmer._id } },
      { $group: { _id: null, average_rating: { $avg: "$rating" }, total_reviews: { $sum: 1 } } },
    ]);

    res.json({
      farmer_id: farmer._id,
      name: user ? user.name : "Unknown",
      village: farmer.village,
      district: farmer.district,
      state: farmer.state,
      verified: farmer.verified,
      crops,
      average_rating: avgResult[0]?.average_rating || 0,
      total_reviews: avgResult[0]?.total_reviews || 0,
      reviews: reviews.map((r) => ({
        rating: r.rating,
        comment: r.comment,
        created_at: r.createdAt,
        company_name: r.buyer_id ? r.buyer_id.company_name : "Anonymous",
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch farmer profile" });
  }
};