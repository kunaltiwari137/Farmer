// // STEP 1: Bring in the database pool
// const pool = require("../config/db");
// const { createNotification } = require("./notificationController");

// // STEP 2: Buyer creates a review for a completed order
// exports.createReview = async (req, res) => {
//   try {
//     const { order_id, rating, comment } = req.body;

//     if (!order_id || !rating) {
//       return res.status(400).json({ error: "order_id and rating are required" });
//     }

//     // STEP 3: Enforce the 1-5 rating range at the application level too (not just the DB constraint)
//     if (rating < 1 || rating > 5) {
//       return res.status(400).json({ error: "Rating must be between 1 and 5" });
//     }

//     // STEP 4: Find the buyer_id belonging to the logged-in user
//     const [buyerRows] = await pool.query("SELECT buyer_id FROM buyers WHERE user_id = ?", [req.user.user_id]);
//     if (buyerRows.length === 0) {
//       return res.status(403).json({ error: "Only registered buyers can leave reviews" });
//     }
//     const buyer_id = buyerRows[0].buyer_id;

//     // STEP 5: Find the order, and get the farmer_id via the crop it belongs to
//     const [orderRows] = await pool.query(
//       `SELECT o.*, c.farmer_id FROM orders o JOIN crops c ON o.crop_id = c.crop_id WHERE o.order_id = ?`,
//       [order_id]
//     );
//     if (orderRows.length === 0) {
//       return res.status(404).json({ error: "Order not found" });
//     }
//     const order = orderRows[0];

//     // STEP 6: Confirm this order actually belongs to this buyer
//     if (order.buyer_id !== buyer_id) {
//       return res.status(403).json({ error: "You can only review your own orders" });
//     }

//     // STEP 7: Only allow reviews on delivered orders
//     if (order.status !== "delivered") {
//       return res.status(400).json({ error: "You can only review completed (delivered) orders" });
//     }

//     // STEP 8: Prevent leaving two reviews for the same order
//     const [existing] = await pool.query("SELECT * FROM reviews WHERE order_id = ?", [order_id]);
//     if (existing.length > 0) {
//       return res.status(409).json({ error: "You already reviewed this order" });
//     }

//     // STEP 9: Insert the review
//     const [result] = await pool.query(
//       "INSERT INTO reviews (buyer_id, farmer_id, order_id, rating, comment) VALUES (?, ?, ?, ?, ?)",
//       [buyer_id, order.farmer_id, order_id, rating, comment || null]
//     );

//     // STEP 10: Notify the farmer that they received a new review
//     const [farmerUserRows] = await pool.query(
//       "SELECT user_id FROM farmers WHERE farmer_id = ?",
//       [order.farmer_id]
//     );
//     if (farmerUserRows.length > 0) {
//       await createNotification(farmerUserRows[0].user_id, `You received a new ${rating}-star review!`, "review");
//     }

//     res.status(201).json({ message: "Review submitted", review_id: result.insertId });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Failed to submit review" });
//   }
// };

// // STEP 10: View all reviews for a specific farmer (public — buyers browsing crops should see this)
// exports.getFarmerReviews = async (req, res) => {
//   try {
//     const { farmer_id } = req.params;

//     const [reviews] = await pool.query(
//       `SELECT r.rating, r.comment, r.created_at, b.company_name
//        FROM reviews r
//        JOIN buyers b ON r.buyer_id = b.buyer_id
//        WHERE r.farmer_id = ?
//        ORDER BY r.created_at DESC`,
//       [farmer_id]
//     );

//     // STEP 11: Also calculate an average rating — useful summary info for the frontend
//     const [avgResult] = await pool.query(
//       "SELECT AVG(rating) as average_rating, COUNT(*) as total_reviews FROM reviews WHERE farmer_id = ?",
//       [farmer_id]
//     );

//     res.json({
//       average_rating: avgResult[0].average_rating,
//       total_reviews: avgResult[0].total_reviews,
//       reviews
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Failed to fetch reviews" });
//   }
// };



// mongoose version

const Review = require("../models/Review");
const Buyer = require("../models/Buyer");
const Farmer = require("../models/Farmer");
const Order = require("../models/Order");
const Crop = require("../models/Crop");
const { createNotification } = require("./notificationController");

// Buyer creates a review for a completed order
exports.createReview = async (req, res) => {
  try {
    const { order_id, rating, comment } = req.body;

    if (!order_id || !rating) {
      return res.status(400).json({
        error: "order_id and rating are required"
      });
    }

    // Rating must be between 1 and 5
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        error: "Rating must be between 1 and 5"
      });
    }

    // Find buyer profile
    const buyer = await Buyer.findOne({
      user_id: req.user.user_id
    });

    if (!buyer) {
      return res.status(403).json({
        error: "Only registered buyers can leave reviews"
      });
    }

    // Find order
    const order = await Order.findById(order_id);

    if (!order) {
      return res.status(404).json({
        error: "Order not found"
      });
    }

    // Make sure this order belongs to this buyer
    if (order.buyer_id.toString() !== buyer._id.toString()) {
      return res.status(403).json({
        error: "You can only review your own orders"
      });
    }

    // Only delivered orders can be reviewed
    if (order.status !== "delivered") {
      return res.status(400).json({
        error: "You can only review completed (delivered) orders"
      });
    }

    // Find the crop to get the farmer
    const crop = await Crop.findById(order.crop_id);

    if (!crop) {
      return res.status(404).json({
        error: "Crop not found"
      });
    }

    const farmer = await Farmer.findById(crop.farmer_id);

    if (!farmer) {
      return res.status(404).json({
        error: "Farmer not found"
      });
    }

    // Prevent duplicate review
    const existing = await Review.findOne({
      order_id: order._id
    });

    if (existing) {
      return res.status(409).json({
        error: "You already reviewed this order"
      });
    }

    // Create review
    const review = await Review.create({
      buyer_id: buyer._id,
      farmer_id: farmer._id,
      order_id: order._id,
      rating,
      comment: comment || null
    });

    // Notify farmer
    await createNotification(
      farmer.user_id,
      `You received a new ${rating}-star review!`,
      "review"
    );

    res.status(201).json({
      message: "Review submitted",
      review_id: review._id
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to submit review"
    });
  }
};


// View all reviews for a specific farmer
exports.getFarmerReviews = async (req, res) => {
  try {
    const { farmer_id } = req.params;

    // Find reviews for this farmer
    const reviews = await Review.find({
      farmer_id
    })
      .populate("buyer_id", "company_name")
      .sort({ createdAt: -1 });

    // Calculate average rating
    const total_reviews = reviews.length;

    const average_rating =
      total_reviews > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / total_reviews
        : 0;

    // Format response
    const formattedReviews = reviews.map(review => ({
      rating: review.rating,
      comment: review.comment,
      created_at: review.createdAt,
      company_name: review.buyer_id
        ? review.buyer_id.company_name
        : null
    }));

    res.json({
      average_rating,
      total_reviews,
      reviews: formattedReviews
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to fetch reviews"
    });
  }
};
