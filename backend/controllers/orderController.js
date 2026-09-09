// STEP 1: Bring in the database pool
const pool = require("../config/db");
const { createNotification } = require("./notificationController");

// STEP 2: Create and export an async function called createOrder
exports.createOrder = async (req, res) => {
  try {
    // STEP 3: Pull the crop being ordered and the quantity from the request body
    const { crop_id, quantity } = req.body;

    if (!crop_id || !quantity) {
      return res.status(400).json({ error: "crop_id and quantity are required" });
    }

    // STEP 4: Find the buyer_id belonging to the logged-in user
    const [buyerRows] = await pool.query("SELECT buyer_id FROM buyers WHERE user_id = ?", [req.user.user_id]);
    if (buyerRows.length === 0) {
      return res.status(403).json({ error: "Only registered buyers can place orders" });
    }
    const buyer_id = buyerRows[0].buyer_id;

    // STEP 5: Find the crop being ordered
    const [cropRows] = await pool.query("SELECT * FROM crops WHERE crop_id = ?", [crop_id]);
    if (cropRows.length === 0) {
      return res.status(404).json({ error: "Crop not found" });
    }
    const crop = cropRows[0];

    // STEP 6: Check the crop is actually available and has enough quantity
    if (crop.status !== "available") {
      return res.status(400).json({ error: "This crop is no longer available" });
    }
    if (quantity > crop.quantity) {
      return res.status(400).json({ error: `Only ${crop.quantity} kg available` });
    }

    // STEP 7: Calculate the total price on the server — never trust a client-sent total
    const total_amount = quantity * crop.price;

    // STEP 8: Insert the order
    const [result] = await pool.query(
      "INSERT INTO orders (crop_id, buyer_id, quantity, total_amount, status) VALUES (?, ?, ?, ?, 'pending')",
      [crop_id, buyer_id, quantity, total_amount]
    );

    // STEP 9: Notify the farmer that someone ordered their crop
    const [farmerUserRows] = await pool.query(
      "SELECT u.user_id FROM users u JOIN farmers f ON u.user_id = f.user_id WHERE f.farmer_id = ?",
      [crop.farmer_id]
    );
    if (farmerUserRows.length > 0) {
      await createNotification(
        farmerUserRows[0].user_id,
        `New order: ${quantity}kg of your crop was ordered!`,
        "order"
      );
    }

    // STEP 10: Reduce the crop's remaining quantity, marking it sold_out if it hits zero
    const remaining = crop.quantity - quantity;
    const newStatus = remaining <= 0 ? "sold_out" : "available";
    await pool.query("UPDATE crops SET quantity = ?, status = ? WHERE crop_id = ?", [remaining, newStatus, crop_id]);

    // STEP 11: Confirm success
    res.status(201).json({
      message: "Order placed successfully",
      order_id: result.insertId,
      total_amount
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to place order" });
  }
};

// STEP 1: Create and export an async function called getMyOrders (for buyers)
exports.getMyOrders = async (req, res) => {
  try {
    // STEP 2: Find the buyer_id belonging to the logged-in user
    const [buyerRows] = await pool.query("SELECT buyer_id FROM buyers WHERE user_id = ?", [req.user.user_id]);
    if (buyerRows.length === 0) {
      return res.status(403).json({ error: "Only registered buyers can view orders" });
    }
    const buyer_id = buyerRows[0].buyer_id;

    // STEP 3: Join orders with crops to show useful details, not just raw IDs
    const [orders] = await pool.query(
      `SELECT o.order_id, o.quantity, o.total_amount, o.status, o.order_date,
              c.crop_name, c.crop_id
       FROM orders o
       JOIN crops c ON o.crop_id = c.crop_id
       WHERE o.buyer_id = ?
       ORDER BY o.order_date DESC`,
      [buyer_id]
    );

    res.json(orders);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

// STEP 1: Create and export an async function called getFarmerOrders
exports.getFarmerOrders = async (req, res) => {
  try {
    // STEP 2: Find the farmer_id belonging to the logged-in user
    const [farmerRows] = await pool.query("SELECT farmer_id FROM farmers WHERE user_id = ?", [req.user.user_id]);
    if (farmerRows.length === 0) {
      return res.status(403).json({ error: "Only registered farmers can view orders" });
    }
    const farmer_id = farmerRows[0].farmer_id;

    // STEP 3: Join orders + crops (to filter by this farmer's crops) + buyers (to show who ordered)
    const [orders] = await pool.query(
      `SELECT o.order_id, o.quantity, o.total_amount, o.status, o.order_date,
              c.crop_name, b.company_name
       FROM orders o
       JOIN crops c ON o.crop_id = c.crop_id
       JOIN buyers b ON o.buyer_id = b.buyer_id
       WHERE c.farmer_id = ?
       ORDER BY o.order_date DESC`,
      [farmer_id]
    );

    res.json(orders);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};