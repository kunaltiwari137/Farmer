const User = require("../models/User");
const Farmer = require("../models/Farmer");
const Buyer = require("../models/Buyer");
const Crop = require("../models/Crop");
const Order = require("../models/Order");
const Payment = require("../models/Payment");

// ==========================================
// GET ALL USERS
// ==========================================
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("name email phone role status createdAt")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error("getAllUsers error:", error);

    res.status(500).json({
      error: "Failed to fetch users",
    });
  }
};

// ==========================================
// GET ALL FARMERS
// ==========================================
exports.getAllFarmers = async (req, res) => {
  try {
    const farmers = await Farmer.find()
      .populate(
        "user_id",
        "name email phone role status createdAt updatedAt"
      )
      .sort({ verified: 1 });

    const result = farmers.map((f) => ({
      farmer_id: f._id,

      name: f.user_id ? f.user_id.name : "Unknown",

      email: f.user_id ? f.user_id.email : "",

      phone: f.user_id ? f.user_id.phone : "",

      role: f.user_id ? f.user_id.role : "",

      status: f.user_id ? f.user_id.status : "",

      village: f.village,

      district: f.district,

      state: f.state,

      verified: f.verified,

      createdAt: f.createdAt,

      updatedAt: f.updatedAt,
    }));

    res.json(result);
  } catch (error) {
    console.error("getAllFarmers error:", error);

    res.status(500).json({
      error: "Failed to fetch farmers",
    });
  }
};

// ==========================================
// GET SINGLE FARMER DETAILS
// ==========================================
exports.getFarmerDetails = async (req, res) => {
  try {
    const { farmer_id } = req.params;

    const farmer = await Farmer.findById(farmer_id).populate(
      "user_id",
      "name email phone role status createdAt updatedAt"
    );

    if (!farmer) {
      return res.status(404).json({
        error: "Farmer not found",
      });
    }

    res.json(farmer);
  } catch (error) {
    console.error("getFarmerDetails error:", error);

    res.status(500).json({
      error: "Failed to fetch farmer details",
    });
  }
};

// ==========================================
// GET ALL BUYERS
// ==========================================
exports.getAllBuyers = async (req, res) => {
  try {
    const buyers = await Buyer.find()
      .populate(
        "user_id",
        "name email phone role status createdAt updatedAt"
      )
      .sort({ createdAt: -1 });

    res.json(buyers);
  } catch (error) {
    console.error("getAllBuyers error:", error);

    res.status(500).json({
      error: "Failed to fetch buyers",
    });
  }
};

// ==========================================
// GET SINGLE BUYER DETAILS
// ==========================================
exports.getBuyerDetails = async (req, res) => {
  try {
    const { buyer_id } = req.params;

    const buyer = await Buyer.findById(buyer_id).populate(
      "user_id",
      "name email phone role status createdAt updatedAt"
    );

    if (!buyer) {
      return res.status(404).json({
        error: "Buyer not found",
      });
    }

    res.json(buyer);
  } catch (error) {
    console.error("getBuyerDetails error:", error);

    res.status(500).json({
      error: "Failed to fetch buyer details",
    });
  }
};

// ==========================================
// VERIFY / UNVERIFY FARMER
// ==========================================
exports.verifyFarmer = async (req, res) => {
  try {
    const { farmer_id } = req.params;
    const { verified } = req.body;

    const farmer = await Farmer.findById(farmer_id);

    if (!farmer) {
      return res.status(404).json({
        error: "Farmer not found",
      });
    }

    farmer.verified = verified;

    await farmer.save();

    res.json({
      message: `Farmer ${
        verified ? "verified" : "unverified"
      } successfully`,
    });
  } catch (error) {
    console.error("verifyFarmer error:", error);

    res.status(500).json({
      error: "Failed to update farmer verification",
    });
  }
};

// ==========================================
// GET ALL ORDERS
// ==========================================
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("crop_id", "crop_name")
      .populate("buyer_id", "company_name")
      .sort({ createdAt: -1 });

    const result = orders.map((o) => ({
      order_id: o._id,

      quantity: o.quantity,

      total_amount: o.total_amount,

      status: o.status,

      order_date: o.createdAt,

      crop_name: o.crop_id
        ? o.crop_id.crop_name
        : null,

      company_name: o.buyer_id
        ? o.buyer_id.company_name
        : null,
    }));

    res.json(result);
  } catch (error) {
    console.error("getAllOrders error:", error);

    res.status(500).json({
      error: "Failed to fetch orders",
    });
  }
};

// ==========================================
// REMOVE CROP
// ==========================================
exports.removeCrop = async (req, res) => {
  try {
    const { crop_id } = req.params;

    const existing = await Crop.findById(crop_id);

    if (!existing) {
      return res.status(404).json({
        error: "Crop not found",
      });
    }

    await Crop.findByIdAndDelete(crop_id);

    res.json({
      message: "Crop listing removed",
    });
  } catch (error) {
    console.error("removeCrop error:", error);

    res.status(500).json({
      error: "Failed to remove crop",
    });
  }
};

// ==========================================
// FLAG CROP
// ==========================================
exports.flagCrop = async (req, res) => {
  try {
    const { crop_id } = req.params;
    const { reason } = req.body;

    const crop = await Crop.findById(crop_id);

    if (!crop) {
      return res.status(404).json({
        error: "Crop not found",
      });
    }

    crop.status = "flagged";

    crop.flag_reason =
      reason || "Policy violation";

    await crop.save();

    res.json({
      message: "Crop flagged",
    });
  } catch (error) {
    console.error("flagCrop error:", error);

    res.status(500).json({
      error: "Failed to flag crop",
    });
  }
};

// ==========================================
// PLATFORM STATS
// ==========================================
exports.getPlatformStats = async (req, res) => {
  try {
    const userCounts = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    const total_crops =
      await Crop.countDocuments();

    const total_orders =
      await Order.countDocuments();

    const revenueResult =
      await Payment.aggregate([
        {
          $match: {
            payment_status: "released",
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$amount",
            },
          },
        },
      ]);

    res.json({
      users_by_role: userCounts.map((u) => ({
        role: u._id,
        count: u.count,
      })),

      total_crops,

      total_orders,

      total_platform_revenue:
        revenueResult[0]?.total || 0,
    });
  } catch (error) {
    console.error("getPlatformStats error:", error);

    res.status(500).json({
      error: "Failed to fetch platform stats",
    });
  }
};

// ==========================================
// GET PENDING USERS
// ==========================================
exports.getPendingUsers = async (req, res) => {
  try {
    const pendingUsers = await User.find({
      status: "pending",
    })
      .select(
        "name email phone role createdAt"
      )
      .sort({ createdAt: -1 });

    res.json(pendingUsers);
  } catch (error) {
    console.error("getPendingUsers error:", error);

    res.status(500).json({
      error: "Failed to fetch pending users",
    });
  }
};

// ==========================================
// APPROVE / REJECT USER
// ==========================================
exports.reviewUser = async (req, res) => {
  try {
    const { user_id } = req.params;

    const { decision } = req.body;

    if (
      decision !== "approved" &&
      decision !== "rejected"
    ) {
      return res.status(400).json({
        error:
          "decision must be 'approved' or 'rejected'",
      });
    }

    const user =
      await User.findById(user_id);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    user.status = decision;

    await user.save();

    res.json({
      message: `User ${decision}`,
    });
  } catch (error) {
    console.error(
      "reviewUser error:",
      error
    );

    res.status(500).json({
      error: "Failed to review user",
    });
  }
};