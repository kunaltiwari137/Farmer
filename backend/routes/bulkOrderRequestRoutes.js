const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  createBulkRequest,
  getMyBulkRequests,
} = require("../controllers/bulkOrderRequestController");

// ==========================================
// CREATE BULK REQUEST
// ==========================================
// Buyer creates a requirement.
//
// POST
// /api/bulk-requests
// ==========================================
router.post(
  "/",
  authMiddleware,
  createBulkRequest
);

// ==========================================
// GET BUYER'S BULK REQUESTS
// ==========================================
// Buyer can see requests created by them.
//
// GET
// /api/bulk-requests/my-requests
// ==========================================
router.get(
  "/my-requests",
  authMiddleware,
  getMyBulkRequests
);

module.exports = router;