const express = require("express");

const router = express.Router();

const adminController = require("../controllers/adminController");

const authMiddleware = require("../middleware/authMiddleware");

const adminMiddleware = require("../middleware/adminMiddleware");

// ==========================================
// USERS
// ==========================================

router.get(
  "/users",
  authMiddleware,
  adminMiddleware,
  adminController.getAllUsers
);

// ==========================================
// FARMERS
// ==========================================

router.get(
  "/farmers",
  authMiddleware,
  adminMiddleware,
  adminController.getAllFarmers
);

router.get(
  "/farmers/:farmer_id",
  authMiddleware,
  adminMiddleware,
  adminController.getFarmerDetails
);

router.put(
  "/farmers/:farmer_id/verify",
  authMiddleware,
  adminMiddleware,
  adminController.verifyFarmer
);

// ==========================================
// BUYERS
// ==========================================

router.get(
  "/buyers",
  authMiddleware,
  adminMiddleware,
  adminController.getAllBuyers
);

router.get(
  "/buyers/:buyer_id",
  authMiddleware,
  adminMiddleware,
  adminController.getBuyerDetails
);

// ==========================================
// ORDERS
// ==========================================

router.get(
  "/orders",
  authMiddleware,
  adminMiddleware,
  adminController.getAllOrders
);

// ==========================================
// CROPS
// ==========================================

router.delete(
  "/crops/:crop_id",
  authMiddleware,
  adminMiddleware,
  adminController.removeCrop
);

router.put(
  "/crops/:crop_id/flag",
  authMiddleware,
  adminMiddleware,
  adminController.flagCrop
);

// ==========================================
// STATS
// ==========================================

router.get(
  "/stats",
  authMiddleware,
  adminMiddleware,
  adminController.getPlatformStats
);

// ==========================================
// PENDING USERS
// ==========================================

router.get(
  "/pending-users",
  authMiddleware,
  adminMiddleware,
  adminController.getPendingUsers
);

// ==========================================
// APPROVE / REJECT USER
// ==========================================

router.put(
  "/users/:user_id/review",
  authMiddleware,
  adminMiddleware,
  adminController.reviewUser
);

module.exports = router;