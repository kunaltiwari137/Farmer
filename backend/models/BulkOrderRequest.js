const mongoose = require("mongoose");

// ==========================================
// DELIVERY ADDRESS SCHEMA
// ==========================================

const deliveryAddressSchema = new mongoose.Schema(
  {
    full_name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    house: {
      type: String,
      required: true,
      trim: true,
    },

    area: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    district: {
      type: String,
      required: true,
      trim: true,
    },

    state: {
      type: String,
      required: true,
      trim: true,
    },

    pincode: {
      type: String,
      required: true,
      trim: true,
    },

    landmark: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: false,
  }
);

// ==========================================
// BULK ORDER REQUEST SCHEMA
// ==========================================

const bulkOrderRequestSchema = new mongoose.Schema(
  {
    // Buyer who created the requirement
    buyer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Buyer",
      required: true,
    },

    // Crop requested by buyer
    crop_name: {
      type: String,
      required: true,
      trim: true,
    },

    // Total quantity requested by buyer
    requested_quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    // Quantity that is still not fulfilled
    remaining_quantity: {
      type: Number,
      required: true,
      min: 0,
    },

    // Optional target price entered by buyer
    target_price: {
      type: Number,
      min: 0,
      default: null,
    },

    // Delivery address for final bulk order
    delivery_address: {
      type: deliveryAddressSchema,
      required: true,
    },

    // Current state of the bulk requirement
    status: {
      type: String,
      enum: [
        "open",
        "partially_fulfilled",
        "fulfilled",
        "cancelled",
      ],
      default: "open",
    },

    // Optional expiry date
    expires_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "BulkOrderRequest",
  bulkOrderRequestSchema
);