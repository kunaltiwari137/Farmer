const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

// STEP 1: Teeno controller files se sahi functions import karo
const {
  createBulkRequest,
  getMyBulkRequests,
  getFarmerBulkRequests,
  submitBulkOffer,
} = require("../controllers/bulkOrderRequestController");

const {
  getBulkOffers,
} = require("../controllers/bulkOrderOfferController");

const {
  acceptBulkOffers,
} = require("../controllers/bulkOrderAcceptanceController");

// ==========================================
// STATIC ROUTES — pehle define karo, kyunki
// Express upar se neeche match karta hai.
// "/farmer" ko agar "/:requestId" ke BAAD
// likha jaaye, to Express "farmer" ko ek ID
// samajh lega aur galat error dega — yahi
// asli bug tha.
// ==========================================

// Buyer ek naya bulk requirement banata hai
router.post("/", authMiddleware, createBulkRequest);

// Buyer apne saare bulk requests dekhta hai
router.get("/my-requests", authMiddleware, getMyBulkRequests);

// Farmer un requests ko dekhta hai jinke crops uske paas available hain
router.get("/farmer", authMiddleware, getFarmerBulkRequests);

// ==========================================
// DYNAMIC ROUTES — hamesha static routes ke
// BAAD aane chahiye
// ==========================================

// Farmer ek specific request pe offer submit karta hai
router.post("/:requestId/offers", authMiddleware, submitBulkOffer);

// Buyer ek specific request ke saare offers dekhta hai
router.get("/:requestId/offers", authMiddleware, getBulkOffers);

// Buyer chuni hui offers accept karta hai, final order banta hai
router.post("/:requestId/accept-offers", authMiddleware, acceptBulkOffers);

module.exports = router;