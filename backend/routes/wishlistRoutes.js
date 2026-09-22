const express = require("express");

const router = express.Router();

const wishlistController = require("../controllers/wishlistController");

const authMiddleware = require("../middleware/authMiddleware");

router.post(
  "/toggle",
  authMiddleware,
  wishlistController.toggleWishlist
);

router.get(
  "/",
  authMiddleware,
  wishlistController.getMyWishlist
);

router.get(
  "/check/:crop_id",
  authMiddleware,
  wishlistController.checkWishlist
);

module.exports = router;