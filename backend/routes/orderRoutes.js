const express = require("express");

const router = express.Router();

const orderController = require("../controllers/orderController");

const authMiddleware = require("../middleware/authMiddleware");

const {
  orderValidation,
  handleValidationErrors,
} = require("../middleware/validators");

// ==========================================
// CREATE NORMAL ORDER
// ==========================================
router.post(
  "/",
  authMiddleware,
  orderValidation,
  handleValidationErrors,
  orderController.createOrder
);

// ==========================================
// CREATE BULK / MULTI-FARMER ORDER
// ==========================================
router.post(
  "/bulk",
  authMiddleware,
  orderController.createBulkOrder
);

// ==========================================
// GET BUYER'S ORDERS
// ==========================================
router.get(
  "/my-orders",
  authMiddleware,
  orderController.getMyOrders
);

// ==========================================
// GET FARMER'S ORDERS
// ==========================================
router.get(
  "/farmer-orders",
  authMiddleware,
  orderController.getFarmerOrders
);

module.exports = router;