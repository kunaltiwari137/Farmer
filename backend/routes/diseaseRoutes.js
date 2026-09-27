const express = require("express");

const router = express.Router();

const upload = require("../middleware/upload");

const {
  detectDisease,
} = require("../controllers/diseaseController");

// Plant disease detection
router.post(
  "/predict",
  upload.single("image"),
  detectDisease
);

module.exports = router;