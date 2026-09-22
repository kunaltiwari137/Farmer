const express = require("express");
const router = express.Router();
const farmerController = require("../controllers/farmerController");

router.get("/:id/profile", farmerController.getFarmerProfile);

module.exports = router;
