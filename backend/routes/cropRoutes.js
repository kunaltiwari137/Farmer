const express = require("express");

const router = express.Router();

const cropController = require("../controllers/cropController");

const authMiddleware = require("../middleware/authMiddleware");

const upload = require("../middleware/upload");

const {
  cropValidation,
  handleValidationErrors,
} = require("../middleware/validators");

// ==========================================
// GET ALL AVAILABLE CROPS
// ==========================================

router.get(
  "/",
  cropController.getAllCrops
);

// ==========================================
// GET SINGLE CROP
// ==========================================

router.get(
  "/:id",
  cropController.getCropById
);

// ==========================================
// UPLOAD SINGLE IMAGE
// ==========================================

router.post(
  "/upload-image",
  authMiddleware,
  upload.single("image"),
  cropController.uploadCropImage
);

// ==========================================
// UPLOAD MULTIPLE IMAGES
// Maximum 5 images
// ==========================================

router.post(
  "/upload-images",
  authMiddleware,
  upload.array("images", 5),
  cropController.uploadCropImages
);

// ==========================================
// CREATE CROP
// ==========================================

router.post(
  "/",
  authMiddleware,
  cropValidation,
  handleValidationErrors,
  cropController.createCrop
);

// ==========================================
// UPDATE CROP
// ==========================================

router.put(
  "/:id",
  authMiddleware,
  cropController.updateCrop
);

// ==========================================
// DELETE CROP
// ==========================================

router.delete(
  "/:id",
  authMiddleware,
  cropController.deleteCrop
);

module.exports = router;