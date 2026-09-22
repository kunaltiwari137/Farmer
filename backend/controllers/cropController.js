const Crop = require("../models/Crop");
const Farmer = require("../models/Farmer");
const cloudinary = require("../config/cloudinary");

// ==========================================
// GET ALL AVAILABLE CROPS
// ==========================================

exports.getAllCrops = async (req, res) => {
  try {
    const crops = await Crop.find({ status: "available" });

    res.json(crops);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to fetch crops",
    });
  }
};

// ==========================================
// CREATE CROP
// ==========================================

exports.createCrop = async (req, res) => {
  try {
    const {
      crop_name,
      category,
      quantity,
      price,
      harvest_date,
      organic,
      image_url,
      image_urls,
    } = req.body;

    // Required fields
    if (!crop_name || !quantity || !price) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    // Find farmer
    const farmer = await Farmer.findOne({
      user_id: req.user.user_id,
    });

    if (!farmer) {
      return res.status(403).json({
        error: "Only registered farmers can list crops",
      });
    }

    // Convert image_urls safely
    let images = [];

    if (Array.isArray(image_urls)) {
      images = image_urls.filter(
        (url) => typeof url === "string" && url.trim() !== ""
      );
    }

    // Maximum 5 images
    if (images.length > 5) {
      return res.status(400).json({
        error: "A crop can have maximum 5 images",
      });
    }

    // If only old image_url is provided,
    // use it as the first image.
    if (images.length === 0 && image_url) {
      images = [image_url];
    }

    const crop = await Crop.create({
      farmer_id: farmer._id,

      crop_name,

      category: category || "Other",

      quantity,

      price,

      harvest_date: harvest_date || null,

      organic: organic || false,

      // Keep first image in old field
      image_url: images.length > 0 ? images[0] : "",

      // Store all images
      image_urls: images,
    });

    res.status(201).json({
      message: "Crop listed successfully",

      crop_id: crop._id,

      crop,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to create crop",
    });
  }
};

// ==========================================
// GET CROP BY ID
// ==========================================

exports.getCropById = async (req, res) => {
  try {
    const { id } = req.params;

    const crop = await Crop.findById(id);

    if (!crop) {
      return res.status(404).json({
        error: "Crop not found",
      });
    }

    res.json(crop);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to fetch crop",
    });
  }
};

// ==========================================
// UPDATE CROP
// ==========================================

exports.updateCrop = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      crop_name,
      category,
      quantity,
      price,
      harvest_date,
      organic,
      image_url,
      image_urls,
      status,
    } = req.body;

    const crop = await Crop.findById(id);

    if (!crop) {
      return res.status(404).json({
        error: "Crop not found",
      });
    }

    // Find farmer
    const farmer = await Farmer.findOne({
      user_id: req.user.user_id,
    });

    if (!farmer) {
      return res.status(403).json({
        error: "Only registered farmers can update crops",
      });
    }

    // Check ownership
    if (crop.farmer_id.toString() !== farmer._id.toString()) {
      return res.status(403).json({
        error: "You can only update your own crops",
      });
    }

    // ==========================================
    // BASIC CROP DETAILS
    // ==========================================

    if (crop_name !== undefined) {
      crop.crop_name = crop_name;
    }

    if (category !== undefined) {
      crop.category = category;
    }

    if (quantity !== undefined) {
      crop.quantity = quantity;
    }

    if (price !== undefined) {
      crop.price = price;
    }

    if (harvest_date !== undefined) {
      crop.harvest_date = harvest_date;
    }

    if (organic !== undefined) {
      crop.organic = organic;
    }

    if (status !== undefined) {
      crop.status = status;
    }

    // ==========================================
    // UPDATE IMAGES
    // ==========================================

    if (image_urls !== undefined) {
      if (!Array.isArray(image_urls)) {
        return res.status(400).json({
          error: "image_urls must be an array",
        });
      }

      const images = image_urls.filter(
        (url) => typeof url === "string" && url.trim() !== ""
      );

      if (images.length > 5) {
        return res.status(400).json({
          error: "A crop can have maximum 5 images",
        });
      }

      crop.image_urls = images;

      // First image becomes main image
      crop.image_url = images.length > 0 ? images[0] : "";
    } else if (image_url !== undefined) {
      // Backward compatibility for old single-image update
      crop.image_url = image_url;

      // If there are no multiple images yet,
      // add this image as the first image.
      if (!crop.image_urls || crop.image_urls.length === 0) {
        crop.image_urls = image_url ? [image_url] : [];
      }
    }

    await crop.save();

    res.json({
      message: "Crop updated successfully",

      crop,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to update crop",
    });
  }
};

// ==========================================
// DELETE CROP
// ==========================================

exports.deleteCrop = async (req, res) => {
  try {
    const { id } = req.params;

    const crop = await Crop.findById(id);

    if (!crop) {
      return res.status(404).json({
        error: "Crop not found",
      });
    }

    const farmer = await Farmer.findOne({
      user_id: req.user.user_id,
    });

    if (
      !farmer ||
      crop.farmer_id.toString() !== farmer._id.toString()
    ) {
      return res.status(403).json({
        error: "You can only delete your own crops",
      });
    }

    await Crop.findByIdAndDelete(id);

    res.json({
      message: "Crop deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to delete crop",
    });
  }
};

// ==========================================
// UPLOAD SINGLE CROP IMAGE
// ==========================================

exports.uploadCropImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "No image file provided",
      });
    }

    const uploadFromBuffer = (buffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "agriconnect_crops",
          },
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        );

        stream.end(buffer);
      });
    };

    const result = await uploadFromBuffer(req.file.buffer);

    res.json({
      image_url: result.secure_url,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Image upload failed",
    });
  }
};

// ==========================================
// UPLOAD MULTIPLE CROP IMAGES
// ==========================================

exports.uploadCropImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: "No image files provided",
      });
    }

    // Maximum 5 images
    if (req.files.length > 5) {
      return res.status(400).json({
        error: "You can upload maximum 5 images at once",
      });
    }

    const uploadFromBuffer = (buffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "agriconnect_crops",
          },
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          }
        );

        stream.end(buffer);
      });
    };

    // Upload all images to Cloudinary
    const uploadPromises = req.files.map((file) =>
      uploadFromBuffer(file.buffer)
    );

    const results = await Promise.all(uploadPromises);

    // Extract URLs
    const urls = results.map((result) => result.secure_url);

    res.json({
      image_urls: urls,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Image upload failed",
    });
  }
};