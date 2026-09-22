const mongoose = require("mongoose");

// ==========================================
// DELIVERY ADDRESS
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
// BULK ORDER ALLOCATION
// One bulk order can contain crops from
// multiple farmers.
// ==========================================
const allocationSchema = new mongoose.Schema(
  {
    farmer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Farmer",
      required: true,
    },

    crop_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Crop",
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 0,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    total_amount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: true,
  }
);

// ==========================================
// ORDER SCHEMA
// ==========================================
const orderSchema = new mongoose.Schema(
  {
    // ==========================================
    // ORDER TYPE
    // ==========================================
    order_type: {
      type: String,
      enum: ["single", "bulk"],
      default: "single",
    },

    // ==========================================
    // SINGLE ORDER
    // Kept for existing Buy Now orders.
    // ==========================================
    crop_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Crop",
      required: function () {
        return this.order_type === "single";
      },
    },

    // ==========================================
    // BUYER
    // ==========================================
    buyer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Buyer",
      required: true,
    },

    // ==========================================
    // QUANTITY
    // For single orders this is the ordered
    // quantity.
    //
    // For bulk orders this is the total
    // requested quantity.
    // ==========================================
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },

    // ==========================================
    // TOTAL AMOUNT
    // ==========================================
    total_amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // ==========================================
    // BULK ORDER DETAILS
    // ==========================================
    crop_name: {
      type: String,
      trim: true,
      default: "",
    },

    allocations: {
      type: [allocationSchema],
      default: [],
    },

    // ==========================================
    // DELIVERY ADDRESS
    // ==========================================
    delivery_address: {
      type: deliveryAddressSchema,
      required: true,
    },

    // ==========================================
    // NEGOTIATION
    // ==========================================
    offered_price: {
      type: Number,
    },

    negotiation_status: {
      type: String,
      enum: [
        "none",
        "pending",
        "accepted",
        "rejected",
        "countered",
      ],
      default: "none",
    },

    // ==========================================
    // ORDER STATUS
    // ==========================================
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);