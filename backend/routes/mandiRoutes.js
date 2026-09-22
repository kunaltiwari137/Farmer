const express = require("express");
const router = express.Router();
const mandiController = require("../controllers/mandiController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

router.get("/", mandiController.getAllMandiPrices); // public — sabko dikhega
router.post("/", authMiddleware, adminMiddleware, mandiController.setMandiPrice);
router.delete("/:id", authMiddleware, adminMiddleware, mandiController.deleteMandiPrice);

module.exports = router;