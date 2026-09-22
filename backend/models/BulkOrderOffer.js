const mongoose = require("mongoose");

const bulkOrderOfferSchema = new mongoose.Schema(
  {
    // ==========================================
    // BULK REQUEST
    // ==========================================
    bulk_request_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BulkOrderRequest",
      required: true,
    },

    // ==========================================
    // FARMER
    // ==========================================
    farmer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Farmer",
      required: true,
    },

    // ==========================================
    // CROP
    // ==========================================
    crop_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Crop",
      required: true,
    },

    // ==========================================
    // OFFERED QUANTITY
    // ==========================================
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },

    // ==========================================
    // OFFERED PRICE PER KG
    // ==========================================
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    // ==========================================
    // TOTAL OFFER VALUE
    // ==========================================
    total_amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // ==========================================
    // OFFER STATUS
    // ==========================================
    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "rejected",
        "withdrawn",
      ],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "BulkOrderOffer",
  bulkOrderOfferSchema
);