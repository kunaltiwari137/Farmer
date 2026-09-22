const express = require("express");

const router = express.Router();

const cartController = require("../controllers/cartController");

const authMiddleware = require("../middleware/authMiddleware");

// ==========================================
// GET CART
// ==========================================
router.get(
  "/",
  authMiddleware,
  cartController.getCart
);

// ==========================================
// ADD TO CART
// ==========================================
router.post(
  "/add",
  authMiddleware,
  cartController.addToCart
);

// ==========================================
// UPDATE CART QUANTITY
// + / - BUTTONS
// ==========================================
router.put(
  "/:crop_id",
  authMiddleware,
  cartController.updateCartQuantity
);

// ==========================================
// REMOVE FROM CART
// ==========================================
router.delete(
  "/:crop_id",
  authMiddleware,
  cartController.removeFromCart
);

// ==========================================
// CHECKOUT CART
// ==========================================
router.post(
  "/checkout",
  authMiddleware,
  cartController.checkoutCart
);

module.exports = router;