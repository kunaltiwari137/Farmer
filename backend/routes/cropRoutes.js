const express = require("express");
const router = express.Router();
const cropController = require("../controllers/cropController");
const authMiddleware = require("../middleware/authMiddleware");
const { cropValidation, handleValidationErrors } = require("../middleware/validators");

router.get("/", cropController.getAllCrops);
router.get("/:id", cropController.getCropById);
router.post("/", authMiddleware, cropValidation, handleValidationErrors, cropController.createCrop);
router.put("/:id", authMiddleware, cropController.updateCrop);
router.delete("/:id", authMiddleware, cropController.deleteCrop);

module.exports = router;