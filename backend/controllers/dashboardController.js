// // STEP 1: Bring in the database pool
// const pool = require("../config/db");

// // STEP 2: Create and export an async function called getFarmerStats
// exports.getFarmerStats = async (req, res) => {
//   try {
//     // STEP 3: Find the farmer_id belonging to the logged-in user
//     const [farmerRows] = await pool.query("SELECT farmer_id FROM farmers WHERE user_id = ?", [req.user.user_id]);
//     if (farmerRows.length === 0) {
//       return res.status(403).json({ error: "Only registered farmers can view this dashboard" });
//     }
//     const farmer_id = farmerRows[0].farmer_id;

//     // STEP 4: Count total crops listed by this farmer
//     const [cropCount] = await pool.query(
//       "SELECT COUNT(*) as total_crops FROM crops WHERE farmer_id = ?",
//       [farmer_id]
//     );

//     // STEP 5: Count total orders placed on this farmer's crops
//     const [orderCount] = await pool.query(
//       `SELECT COUNT(*) as total_orders FROM orders o
//        JOIN crops c ON o.crop_id = c.crop_id
//        WHERE c.farmer_id = ?`,
//       [farmer_id]
//     );

//     // STEP 6: Sum total revenue from RELEASED payments only (money actually earned, not just pending)
//     const [revenue] = await pool.query(
//       `SELECT COALESCE(SUM(p.amount), 0) as total_revenue
//        FROM payments p
//        JOIN orders o ON p.order_id = o.order_id
//        JOIN crops c ON o.crop_id = c.crop_id
//        WHERE c.farmer_id = ? AND p.payment_status = 'released'`,
//       [farmer_id]
//     );

//     // STEP 7: Get average rating and review count
//     const [ratingData] = await pool.query(
//       "SELECT AVG(rating) as average_rating, COUNT(*) as total_reviews FROM reviews WHERE farmer_id = ?",
//       [farmer_id]
//     );

//     // STEP 8: Send everything back as one combined object
//     res.json({
//       total_crops: cropCount[0].total_crops,
//       total_orders: orderCount[0].total_orders,
//       total_revenue: revenue[0].total_revenue,
//       average_rating: ratingData[0].average_rating,
//       total_reviews: ratingData[0].total_reviews,
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Failed to fetch dashboard stats" });
//   }
// };

// // STEP 9: Get ALL of this farmer's crops (including sold_out/expired), for management purposes
// exports.getMyCrops = async (req, res) => {
//   try {
//     const [farmerRows] = await pool.query("SELECT farmer_id FROM farmers WHERE user_id = ?", [req.user.user_id]);
//     if (farmerRows.length === 0) {
//       return res.status(403).json({ error: "Only registered farmers can view their crops" });
//     }
//     const farmer_id = farmerRows[0].farmer_id;

//     const [crops] = await pool.query(
//       "SELECT * FROM crops WHERE farmer_id = ? ORDER BY created_at DESC",
//       [farmer_id]
//     );

//     res.json(crops);

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Failed to fetch your crops" });
//   }
// };

// // STEP 1: Farmer's revenue broken down by month, for a chart
// exports.getFarmerRevenueByMonth = async (req, res) => {
//   try {
//     const [farmerRows] = await pool.query("SELECT farmer_id FROM farmers WHERE user_id = ?", [req.user.user_id]);
//     if (farmerRows.length === 0) {
//       return res.status(403).json({ error: "Only registered farmers can view this" });
//     }
//     const farmer_id = farmerRows[0].farmer_id;

//     // STEP 2: DATE_FORMAT groups rows by year-month, e.g. "2026-08"
//     const [revenue] = await pool.query(
//       `SELECT DATE_FORMAT(p.created_at, '%Y-%m') as month, SUM(p.amount) as revenue
//        FROM payments p
//        JOIN orders o ON p.order_id = o.order_id
//        JOIN crops c ON o.crop_id = c.crop_id
//        WHERE c.farmer_id = ? AND p.payment_status = 'released'
//        GROUP BY month
//        ORDER BY month ASC`,
//       [farmer_id]
//     );

//     res.json(revenue);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Failed to fetch revenue data" });
//   }
// };

// // STEP 3: Farmer's best-selling crops, by total quantity sold
// exports.getFarmerTopCrops = async (req, res) => {
//   try {
//     const [farmerRows] = await pool.query("SELECT farmer_id FROM farmers WHERE user_id = ?", [req.user.user_id]);
//     if (farmerRows.length === 0) {
//       return res.status(403).json({ error: "Only registered farmers can view this" });
//     }
//     const farmer_id = farmerRows[0].farmer_id;

//     const [topCrops] = await pool.query(
//       `SELECT c.crop_name, SUM(o.quantity) as total_sold, SUM(o.total_amount) as total_earned
//        FROM orders o
//        JOIN crops c ON o.crop_id = c.crop_id
//        WHERE c.farmer_id = ?
//        GROUP BY c.crop_name
//        ORDER BY total_sold DESC
//        LIMIT 5`,
//       [farmer_id]
//     );

//     res.json(topCrops);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Failed to fetch top crops" });
//   }
// };

// // STEP 4: Buyer's spending summary
// exports.getBuyerSpending = async (req, res) => {
//   try {
//     const [buyerRows] = await pool.query("SELECT buyer_id FROM buyers WHERE user_id = ?", [req.user.user_id]);
//     if (buyerRows.length === 0) {
//       return res.status(403).json({ error: "Only registered buyers can view this" });
//     }
//     const buyer_id = buyerRows[0].buyer_id;

//     const [totalSpent] = await pool.query(
//       `SELECT COALESCE(SUM(p.amount), 0) as total_spent
//        FROM payments p JOIN orders o ON p.order_id = o.order_id
//        WHERE o.buyer_id = ?`,
//       [buyer_id]
//     );

//     const [byMonth] = await pool.query(
//       `SELECT DATE_FORMAT(p.created_at, '%Y-%m') as month, SUM(p.amount) as spent
//        FROM payments p JOIN orders o ON p.order_id = o.order_id
//        WHERE o.buyer_id = ?
//        GROUP BY month ORDER BY month ASC`,
//       [buyer_id]
//     );

//     const [byCrop] = await pool.query(
//       `SELECT c.crop_name, SUM(o.total_amount) as spent
//        FROM orders o JOIN crops c ON o.crop_id = c.crop_id
//        WHERE o.buyer_id = ?
//        GROUP BY c.crop_name ORDER BY spent DESC LIMIT 5`,
//       [buyer_id]
//     );

//     res.json({
//       total_spent: totalSpent[0].total_spent,
//       by_month: byMonth,
//       by_crop: byCrop,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Failed to fetch spending data" });
//   }
// };


// mongoose version


const Farmer = require("../models/Farmer");
const Buyer = require("../models/Buyer");
const Crop = require("../models/Crop");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const Review = require("../models/Review");

exports.getFarmerStats = async (req, res) => {
  try {
    const farmer = await Farmer.findOne({ user_id: req.user.user_id });
    if (!farmer) {
      return res.status(403).json({ error: "Only registered farmers can view this dashboard" });
    }

    const total_crops = await Crop.countDocuments({ farmer_id: farmer._id });

    const crops = await Crop.find({ farmer_id: farmer._id }).select("_id");
    const cropIds = crops.map((c) => c._id);

    const total_orders = await Order.countDocuments({ crop_id: { $in: cropIds } });

    const orders = await Order.find({ crop_id: { $in: cropIds } }).select("_id");
    const orderIds = orders.map((o) => o._id);

    const revenueResult = await Payment.aggregate([
      { $match: { order_id: { $in: orderIds }, payment_status: "released" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const ratingResult = await Review.aggregate([
      { $match: { farmer_id: farmer._id } },
      { $group: { _id: null, average_rating: { $avg: "$rating" }, total_reviews: { $sum: 1 } } },
    ]);

    res.json({
      total_crops,
      total_orders,
      total_revenue: revenueResult[0]?.total || 0,
      average_rating: ratingResult[0]?.average_rating || 0,
      total_reviews: ratingResult[0]?.total_reviews || 0,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
};

exports.getMyCrops = async (req, res) => {
  try {
    const farmer = await Farmer.findOne({ user_id: req.user.user_id });
    if (!farmer) {
      return res.status(403).json({ error: "Only registered farmers can view their crops" });
    }

    const crops = await Crop.find({ farmer_id: farmer._id }).sort({ createdAt: -1 });
    res.json(crops);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch your crops" });
  }
};

exports.getFarmerRevenueByMonth = async (req, res) => {
  try {
    const farmer = await Farmer.findOne({ user_id: req.user.user_id });
    if (!farmer) {
      return res.status(403).json({ error: "Only registered farmers can view this" });
    }

    const crops = await Crop.find({ farmer_id: farmer._id }).select("_id");
    const cropIds = crops.map((c) => c._id);
    const orders = await Order.find({ crop_id: { $in: cropIds } }).select("_id");
    const orderIds = orders.map((o) => o._id);

    const revenue = await Payment.aggregate([
      { $match: { order_id: { $in: orderIds }, payment_status: "released" } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          revenue: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(revenue.map((r) => ({ month: r._id, revenue: r.revenue })));

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch revenue data" });
  }
};

exports.getFarmerTopCrops = async (req, res) => {
  try {
    const farmer = await Farmer.findOne({ user_id: req.user.user_id });
    if (!farmer) {
      return res.status(403).json({ error: "Only registered farmers can view this" });
    }

    const crops = await Crop.find({ farmer_id: farmer._id });
    const cropMap = {};
    crops.forEach((c) => { cropMap[c._id.toString()] = c.crop_name; });
    const cropIds = crops.map((c) => c._id);

    const topCrops = await Order.aggregate([
      { $match: { crop_id: { $in: cropIds } } },
      {
        $group: {
          _id: "$crop_id",
          total_sold: { $sum: "$quantity" },
          total_earned: { $sum: "$total_amount" },
        },
      },
      { $sort: { total_sold: -1 } },
      { $limit: 5 },
    ]);

    res.json(topCrops.map((c) => ({
      crop_name: cropMap[c._id.toString()] || "Unknown",
      total_sold: c.total_sold,
      total_earned: c.total_earned,
    })));

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch top crops" });
  }
};

exports.getBuyerSpending = async (req, res) => {
  try {
    const buyer = await Buyer.findOne({ user_id: req.user.user_id });
    if (!buyer) {
      return res.status(403).json({ error: "Only registered buyers can view this" });
    }

    const orders = await Order.find({ buyer_id: buyer._id }).populate("crop_id", "crop_name");
    const orderIds = orders.map((o) => o._id);

    const totalSpentResult = await Payment.aggregate([
      { $match: { order_id: { $in: orderIds } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const byMonth = await Payment.aggregate([
      { $match: { order_id: { $in: orderIds } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          spent: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const byCropMap = {};
    orders.forEach((o) => {
      const name = o.crop_id ? o.crop_id.crop_name : "Unknown";
      byCropMap[name] = (byCropMap[name] || 0) + o.total_amount;
    });
    const byCrop = Object.entries(byCropMap)
      .map(([crop_name, spent]) => ({ crop_name, spent }))
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 5);

    res.json({
      total_spent: totalSpentResult[0]?.total || 0,
      by_month: byMonth.map((m) => ({ month: m._id, spent: m.spent })),
      by_crop: byCrop,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch spending data" });
  }
};

// STEP 8: Weekly digest for farmers
exports.getWeeklyDigest = async (req, res) => {
  try {
    const farmer = await Farmer.findOne({ user_id: req.user.user_id });
    if (!farmer) {
      return res.status(403).json({ error: "Only farmers can view this" });
    }

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const crops = await Crop.find({ farmer_id: farmer._id }).select("_id");
    const cropIds = crops.map((c) => c._id);

    const orders = await Order.find({
      crop_id: { $in: cropIds },
      createdAt: { $gte: oneWeekAgo },
    });

    const kg_sold = orders.reduce((sum, o) => sum + o.quantity, 0);
    const revenue_this_week = orders.reduce((sum, o) => sum + o.total_amount, 0);

    res.json({
      orders_this_week: orders.length,
      kg_sold,
      revenue_this_week,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch digest" });
  }
};