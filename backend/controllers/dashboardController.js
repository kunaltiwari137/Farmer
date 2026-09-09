// STEP 1: Bring in the database pool
const pool = require("../config/db");

// STEP 2: Create and export an async function called getFarmerStats
exports.getFarmerStats = async (req, res) => {
  try {
    // STEP 3: Find the farmer_id belonging to the logged-in user
    const [farmerRows] = await pool.query("SELECT farmer_id FROM farmers WHERE user_id = ?", [req.user.user_id]);
    if (farmerRows.length === 0) {
      return res.status(403).json({ error: "Only registered farmers can view this dashboard" });
    }
    const farmer_id = farmerRows[0].farmer_id;

    // STEP 4: Count total crops listed by this farmer
    const [cropCount] = await pool.query(
      "SELECT COUNT(*) as total_crops FROM crops WHERE farmer_id = ?",
      [farmer_id]
    );

    // STEP 5: Count total orders placed on this farmer's crops
    const [orderCount] = await pool.query(
      `SELECT COUNT(*) as total_orders FROM orders o
       JOIN crops c ON o.crop_id = c.crop_id
       WHERE c.farmer_id = ?`,
      [farmer_id]
    );

    // STEP 6: Sum total revenue from RELEASED payments only (money actually earned, not just pending)
    const [revenue] = await pool.query(
      `SELECT COALESCE(SUM(p.amount), 0) as total_revenue
       FROM payments p
       JOIN orders o ON p.order_id = o.order_id
       JOIN crops c ON o.crop_id = c.crop_id
       WHERE c.farmer_id = ? AND p.payment_status = 'released'`,
      [farmer_id]
    );

    // STEP 7: Get average rating and review count
    const [ratingData] = await pool.query(
      "SELECT AVG(rating) as average_rating, COUNT(*) as total_reviews FROM reviews WHERE farmer_id = ?",
      [farmer_id]
    );

    // STEP 8: Send everything back as one combined object
    res.json({
      total_crops: cropCount[0].total_crops,
      total_orders: orderCount[0].total_orders,
      total_revenue: revenue[0].total_revenue,
      average_rating: ratingData[0].average_rating,
      total_reviews: ratingData[0].total_reviews,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
};

// STEP 9: Get ALL of this farmer's crops (including sold_out/expired), for management purposes
exports.getMyCrops = async (req, res) => {
  try {
    const [farmerRows] = await pool.query("SELECT farmer_id FROM farmers WHERE user_id = ?", [req.user.user_id]);
    if (farmerRows.length === 0) {
      return res.status(403).json({ error: "Only registered farmers can view their crops" });
    }
    const farmer_id = farmerRows[0].farmer_id;

    const [crops] = await pool.query(
      "SELECT * FROM crops WHERE farmer_id = ? ORDER BY created_at DESC",
      [farmer_id]
    );

    res.json(crops);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch your crops" });
  }
};

// STEP 1: Farmer's revenue broken down by month, for a chart
exports.getFarmerRevenueByMonth = async (req, res) => {
  try {
    const [farmerRows] = await pool.query("SELECT farmer_id FROM farmers WHERE user_id = ?", [req.user.user_id]);
    if (farmerRows.length === 0) {
      return res.status(403).json({ error: "Only registered farmers can view this" });
    }
    const farmer_id = farmerRows[0].farmer_id;

    // STEP 2: DATE_FORMAT groups rows by year-month, e.g. "2026-08"
    const [revenue] = await pool.query(
      `SELECT DATE_FORMAT(p.created_at, '%Y-%m') as month, SUM(p.amount) as revenue
       FROM payments p
       JOIN orders o ON p.order_id = o.order_id
       JOIN crops c ON o.crop_id = c.crop_id
       WHERE c.farmer_id = ? AND p.payment_status = 'released'
       GROUP BY month
       ORDER BY month ASC`,
      [farmer_id]
    );

    res.json(revenue);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch revenue data" });
  }
};

// STEP 3: Farmer's best-selling crops, by total quantity sold
exports.getFarmerTopCrops = async (req, res) => {
  try {
    const [farmerRows] = await pool.query("SELECT farmer_id FROM farmers WHERE user_id = ?", [req.user.user_id]);
    if (farmerRows.length === 0) {
      return res.status(403).json({ error: "Only registered farmers can view this" });
    }
    const farmer_id = farmerRows[0].farmer_id;

    const [topCrops] = await pool.query(
      `SELECT c.crop_name, SUM(o.quantity) as total_sold, SUM(o.total_amount) as total_earned
       FROM orders o
       JOIN crops c ON o.crop_id = c.crop_id
       WHERE c.farmer_id = ?
       GROUP BY c.crop_name
       ORDER BY total_sold DESC
       LIMIT 5`,
      [farmer_id]
    );

    res.json(topCrops);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch top crops" });
  }
};

// STEP 4: Buyer's spending summary
exports.getBuyerSpending = async (req, res) => {
  try {
    const [buyerRows] = await pool.query("SELECT buyer_id FROM buyers WHERE user_id = ?", [req.user.user_id]);
    if (buyerRows.length === 0) {
      return res.status(403).json({ error: "Only registered buyers can view this" });
    }
    const buyer_id = buyerRows[0].buyer_id;

    const [totalSpent] = await pool.query(
      `SELECT COALESCE(SUM(p.amount), 0) as total_spent
       FROM payments p JOIN orders o ON p.order_id = o.order_id
       WHERE o.buyer_id = ?`,
      [buyer_id]
    );

    const [byMonth] = await pool.query(
      `SELECT DATE_FORMAT(p.created_at, '%Y-%m') as month, SUM(p.amount) as spent
       FROM payments p JOIN orders o ON p.order_id = o.order_id
       WHERE o.buyer_id = ?
       GROUP BY month ORDER BY month ASC`,
      [buyer_id]
    );

    const [byCrop] = await pool.query(
      `SELECT c.crop_name, SUM(o.total_amount) as spent
       FROM orders o JOIN crops c ON o.crop_id = c.crop_id
       WHERE o.buyer_id = ?
       GROUP BY c.crop_name ORDER BY spent DESC LIMIT 5`,
      [buyer_id]
    );

    res.json({
      total_spent: totalSpent[0].total_spent,
      by_month: byMonth,
      by_crop: byCrop,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch spending data" });
  }
};