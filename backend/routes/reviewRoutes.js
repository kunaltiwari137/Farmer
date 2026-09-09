const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const authMiddleware = require("../middleware/authMiddleware");
const { reviewValidation, handleValidationErrors } = require("../middleware/validators");

router.post("/", authMiddleware, reviewValidation, handleValidationErrors, reviewController.createReview);
router.get("/farmer/:farmer_id", reviewController.getFarmerReviews);

module.exports = router;