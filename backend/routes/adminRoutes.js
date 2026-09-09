const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// STEP 1: Notice BOTH middlewares run on every route here — auth first, then admin check
router.get("/users", authMiddleware, adminMiddleware, adminController.getAllUsers);
router.get("/farmers", authMiddleware, adminMiddleware, adminController.getAllFarmers);
router.put("/farmers/:farmer_id/verify", authMiddleware, adminMiddleware, adminController.verifyFarmer);
router.get("/orders", authMiddleware, adminMiddleware, adminController.getAllOrders);
router.delete("/crops/:crop_id", authMiddleware, adminMiddleware, adminController.removeCrop);
router.get("/stats", authMiddleware, adminMiddleware, adminController.getPlatformStats);

module.exports = router;