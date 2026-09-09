const pool = require("../config/db");

// STEP 1: Get all users on the platform
exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await pool.query(
      "SELECT user_id, name, email, phone, role, created_at FROM users ORDER BY created_at DESC"
    );
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// STEP 2: Get all farmers, including their verification status
exports.getAllFarmers = async (req, res) => {
  try {
    const [farmers] = await pool.query(
      `SELECT f.farmer_id, f.village, f.district, f.state, f.verified,
              u.name, u.email, u.user_id
       FROM farmers f JOIN users u ON f.user_id = u.user_id
       ORDER BY f.verified ASC, u.name ASC`
    );
    res.json(farmers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch farmers" });
  }
};

// STEP 3: Verify (or unverify) a specific farmer
exports.verifyFarmer = async (req, res) => {
  try {
    const { farmer_id } = req.params;
    const { verified } = req.body;

    await pool.query("UPDATE farmers SET verified = ? WHERE farmer_id = ?", [verified, farmer_id]);

    res.json({ message: `Farmer ${verified ? "verified" : "unverified"} successfully` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update farmer verification" });
  }
};

// STEP 4: Get every order on the platform, with full context (crop, buyer, farmer)
exports.getAllOrders = async (req, res) => {
  try {
    const [orders] = await pool.query(
      `SELECT o.order_id, o.quantity, o.total_amount, o.status, o.order_date,
              c.crop_name, b.company_name, uf.name as farmer_name
       FROM orders o
       JOIN crops c ON o.crop_id = c.crop_id
       JOIN buyers b ON o.buyer_id = b.buyer_id
       JOIN farmers f ON c.farmer_id = f.farmer_id
       JOIN users uf ON f.user_id = uf.user_id
       ORDER BY o.order_date DESC`
    );
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

// STEP 5: Admin can remove any crop listing (e.g. fraudulent or inappropriate)
exports.removeCrop = async (req, res) => {
  try {
    const { crop_id } = req.params;

    const [existing] = await pool.query("SELECT * FROM crops WHERE crop_id = ?", [crop_id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Crop not found" });
    }

    await pool.query("DELETE FROM crops WHERE crop_id = ?", [crop_id]);
    res.json({ message: "Crop listing removed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to remove crop" });
  }
};

// STEP 6: Platform-wide summary stats
exports.getPlatformStats = async (req, res) => {
  try {
    const [userCounts] = await pool.query(
      "SELECT role, COUNT(*) as count FROM users GROUP BY role"
    );
    const [cropCount] = await pool.query("SELECT COUNT(*) as total FROM crops");
    const [orderCount] = await pool.query("SELECT COUNT(*) as total FROM orders");
    const [revenue] = await pool.query(
      "SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE payment_status = 'released'"
    );

    res.json({
      users_by_role: userCounts,
      total_crops: cropCount[0].total,
      total_orders: orderCount[0].total,
      total_platform_revenue: revenue[0].total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch platform stats" });
  }
};