const mongoose = require("mongoose");

const cropSchema = new mongoose.Schema(
  {
    // ==========================================
    // FARMER
    // ==========================================

    farmer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Farmer",
      required: true,
    },

    // ==========================================
    // CROP DETAILS
    // ==========================================

    crop_name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: [
        "Vegetables",
        "Fruits",
        "Grains",
        "Dairy",
        "Spices",
        "Other",
      ],
      default: "Other",
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

    harvest_date: {
      type: Date,
    },

    organic: {
      type: Boolean,
      default: false,
    },

    // ==========================================
    // CROP IMAGES
    // ==========================================

    // Old/single image field
    // Kept so existing crops continue working.
    image_url: {
      type: String,
      default: "",
      trim: true,
    },

    // Multiple images
    // Maximum 5 images per crop.
    image_urls: {
      type: [String],
      default: [],
      validate: {
        validator: function (images) {
          return images.length <= 5;
        },
        message: "A crop can have maximum 5 images",
      },
    },

    // ==========================================
    // STATUS
    // ==========================================

    status: {
      type: String,
      enum: [
        "available",
        "sold_out",
        "expired",
        "flagged",
      ],
      default: "available",
    },

    flag_reason: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Crop", cropSchema);