const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/farmer-stats", authMiddleware, dashboardController.getFarmerStats);
router.get("/my-crops", authMiddleware, dashboardController.getMyCrops);
router.get("/farmer-revenue", authMiddleware, dashboardController.getFarmerRevenueByMonth);
router.get("/farmer-top-crops", authMiddleware, dashboardController.getFarmerTopCrops);
router.get("/buyer-spending", authMiddleware, dashboardController.getBuyerSpending);

module.exports = router;