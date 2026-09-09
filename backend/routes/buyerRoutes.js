const express = require("express");
const router = express.Router();
const buyerController = require("../controllers/buyerController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.post(
  "/profile",
  authMiddleware,
  roleMiddleware("buyer"),
  buyerController.createBuyerProfile
);

module.exports = router;