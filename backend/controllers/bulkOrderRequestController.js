const BulkOrderRequest = require("../models/BulkOrderRequest");
const BulkOrderOffer = require("../models/BulkOrderOffer");
const Buyer = require("../models/Buyer");
const Crop = require("../models/Crop");
const Farmer = require("../models/Farmer");
const Notification = require("../models/Notification");
const mongoose = require("mongoose");

// ==========================================
// VALIDATE DELIVERY ADDRESS
// ==========================================
const validateAddress = (address) => {
  if (!address) {
    return "Delivery address is required";
  }

  const requiredFields = [
    "full_name",
    "phone",
    "house",
    "area",
    "city",
    "district",
    "state",
    "pincode",
  ];

  for (const field of requiredFields) {
    if (!address[field] || !String(address[field]).trim()) {
      return `${field} is required`;
    }
  }

  const phone = String(address.phone).replace(/\D/g, "");

  if (phone.length !== 10) {
    return "Phone number must be 10 digits";
  }

  const pincode = String(address.pincode).trim();

  if (!/^\d{6}$/.test(pincode)) {
    return "Pincode must be 6 digits";
  }

  return null;
};

// ==========================================
// CLEAN DELIVERY ADDRESS
// ==========================================
const cleanAddress = (delivery_address) => ({
  full_name: delivery_address.full_name.trim(),
  phone: String(delivery_address.phone).trim(),
  house: delivery_address.house.trim(),
  area: delivery_address.area.trim(),
  city: delivery_address.city.trim(),
  district: delivery_address.district.trim(),
  state: delivery_address.state.trim(),
  pincode: String(delivery_address.pincode).trim(),
  landmark: delivery_address.landmark
    ? delivery_address.landmark.trim()
    : "",
});

// ==========================================
// CREATE BULK REQUEST
// ==========================================
// Buyer creates a requirement.
//
// This creates a request only.
// It does NOT create the final order.
// ==========================================
exports.createBulkRequest = async (req, res) => {
  try {
    const {
      crop_name,
      quantity,
      target_price,
      delivery_address,
    } = req.body;

    // ------------------------------------------
    // Validate crop name
    // ------------------------------------------
    if (!crop_name || !String(crop_name).trim()) {
      return res.status(400).json({
        error: "crop_name is required",
      });
    }

    // ------------------------------------------
    // Validate quantity
    // ------------------------------------------
    const requestedQuantity = Number(quantity);

    if (
      !Number.isFinite(requestedQuantity) ||
      requestedQuantity <= 0
    ) {
      return res.status(400).json({
        error: "Quantity must be greater than 0",
      });
    }

    // ------------------------------------------
    // Validate target price
    // ------------------------------------------
    let targetPrice = null;

    if (
      target_price !== undefined &&
      target_price !== null &&
      target_price !== ""
    ) {
      targetPrice = Number(target_price);

      if (
        !Number.isFinite(targetPrice) ||
        targetPrice < 0
      ) {
        return res.status(400).json({
          error: "Target price must be a valid number",
        });
      }
    }

    // ------------------------------------------
    // Validate address
    // ------------------------------------------
    const addressError = validateAddress(
      delivery_address
    );

    if (addressError) {
      return res.status(400).json({
        error: addressError,
      });
    }

    // ------------------------------------------
    // Find buyer
    // ------------------------------------------
    const buyer = await Buyer.findOne({
      user_id: req.user.user_id,
    });

    if (!buyer) {
      return res.status(403).json({
        error:
          "Only registered buyers can create bulk requests",
      });
    }

    const requestedCropName =
      String(crop_name).trim();

    // ------------------------------------------
    // Create bulk request
    // ------------------------------------------
    const bulkRequest =
      await BulkOrderRequest.create({
        buyer_id: buyer._id,
        crop_name: requestedCropName,
        requested_quantity: requestedQuantity,
        remaining_quantity: requestedQuantity,
        target_price: targetPrice,
        delivery_address:
          cleanAddress(delivery_address),
        status: "open",
      });

    // ------------------------------------------
    // Find farmers who have this crop
    // ------------------------------------------
    const escapedCropName =
      requestedCropName.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );

    const availableCrops = await Crop.find({
      crop_name: {
        $regex: `^${escapedCropName}$`,
        $options: "i",
      },
      status: "available",
      quantity: { $gt: 0 },
    }).select(
      "farmer_id crop_name quantity price"
    );

    // ------------------------------------------
    // Get unique farmer IDs
    // ------------------------------------------
    const farmerIds = [
      ...new Set(
        availableCrops.map((crop) =>
          String(crop.farmer_id)
        )
      ),
    ];

    // ------------------------------------------
    // Find farmers
    // ------------------------------------------
    const farmers = await Farmer.find({
      _id: { $in: farmerIds },
    }).select("_id user_id");

    // ------------------------------------------
    // Notify matching farmers
    // ------------------------------------------
    for (const farmer of farmers) {
      await Notification.create({
        user_id: farmer.user_id,
        related_user_id: req.user.user_id,
        message:
          `New bulk request: Buyer needs ${requestedQuantity}kg of ${requestedCropName}. View the request and submit your supply offer.`,
        type: "bulk_request",
      });
    }

    // ------------------------------------------
    // Response
    // ------------------------------------------
    return res.status(201).json({
      message:
        "Bulk request created successfully",

      request_id: bulkRequest._id,

      crop_name:
        bulkRequest.crop_name,

      requested_quantity:
        bulkRequest.requested_quantity,

      remaining_quantity:
        bulkRequest.remaining_quantity,

      target_price:
        bulkRequest.target_price,

      status:
        bulkRequest.status,

      farmers_notified:
        farmers.length,
    });
  } catch (error) {
    console.error(
      "Create bulk request error:",
      error
    );

    return res.status(500).json({
      error:
        "Failed to create bulk request",
    });
  }
};

// ==========================================
// GET BUYER'S BULK REQUESTS
// ==========================================
exports.getMyBulkRequests = async (req, res) => {
  try {
    // ------------------------------------------
    // Find buyer
    // ------------------------------------------
    const buyer = await Buyer.findOne({
      user_id: req.user.user_id,
    });

    if (!buyer) {
      return res.status(403).json({
        error:
          "Only registered buyers can view bulk requests",
      });
    }

    // ------------------------------------------
    // Find requests
    // ------------------------------------------
    const requests =
      await BulkOrderRequest.find({
        buyer_id: buyer._id,
      }).sort({
        createdAt: -1,
      });

    // ------------------------------------------
    // Get offers for every request
    // ------------------------------------------
    const result = await Promise.all(
      requests.map(async (request) => {
        const offers =
          await BulkOrderOffer.find({
            bulk_request_id: request._id,
          })
            .populate({
              path: "farmer_id",
              select: "user_id village district state",
              populate: {
                path: "user_id",
                select: "name email phone",
              },
            })
            .populate({
              path: "crop_id",
              select: "crop_name quantity price",
            })
            .sort({
              createdAt: -1,
            });

        return {
          request_id: request._id,

          crop_name:
            request.crop_name,

          requested_quantity:
            request.requested_quantity,

          remaining_quantity:
            request.remaining_quantity,

          target_price:
            request.target_price,

          status:
            request.status,

          delivery_address:
            request.delivery_address,

          created_at:
            request.createdAt,

          updated_at:
            request.updatedAt,

          offers,
        };
      })
    );

    return res.json(result);
  } catch (error) {
    console.error(
      "Get buyer bulk requests error:",
      error
    );

    return res.status(500).json({
      error:
        "Failed to fetch bulk requests",
    });
  }
};

// ==========================================
// GET FARMER BULK REQUESTS
// ==========================================
// Farmer sees requests for crops that the
// farmer currently has available.
//
// GET
// /api/bulk-requests/farmer
// ==========================================
exports.getFarmerBulkRequests = async (
  req,
  res
) => {
  try {
    // ------------------------------------------
    // Find farmer profile
    // ------------------------------------------
    const farmer = await Farmer.findOne({
      user_id: req.user.user_id,
    });

    if (!farmer) {
      return res.status(403).json({
        error:
          "Only registered farmers can view bulk requests",
      });
    }

    // ------------------------------------------
    // Find farmer's available crops
    // ------------------------------------------
    const farmerCrops = await Crop.find({
      farmer_id: farmer._id,
      status: "available",
      quantity: { $gt: 0 },
    }).select(
      "_id crop_name quantity price"
    );

    if (farmerCrops.length === 0) {
      return res.json([]);
    }

    // ------------------------------------------
    // Get crop names
    // ------------------------------------------
    const cropNames = [
      ...new Set(
        farmerCrops.map(
          (crop) => crop.crop_name
        )
      ),
    ];

    // ------------------------------------------
    // Find open bulk requests
    // ------------------------------------------
    const requests =
      await BulkOrderRequest.find({
        status: {
          $in: [
            "open",
            "partially_fulfilled",
          ],
        },

        remaining_quantity: {
          $gt: 0,
        },

        crop_name: {
          $in: cropNames.map(
            (name) =>
              new RegExp(
                `^${name.replace(
                  /[.*+?^${}()|[\]\\]/g,
                  "\\$&"
                )}$`,
                "i"
              )
          ),
        },
      })
        .populate({
          path: "buyer_id",
          select: "company_name location",
        })
        .sort({
          createdAt: -1,
        });

    // ------------------------------------------
    // Build response
    // ------------------------------------------
    const result = await Promise.all(
      requests.map(async (request) => {
        const matchingCrops =
          farmerCrops.filter(
            (crop) =>
              crop.crop_name.toLowerCase() ===
              request.crop_name.toLowerCase()
          );

        const totalAvailable =
          matchingCrops.reduce(
            (sum, crop) =>
              sum + Number(crop.quantity || 0),
            0
          );

        // --------------------------------------
        // Check if this farmer already submitted
        // an active offer for this request
        // --------------------------------------
        const existingOffer =
          await BulkOrderOffer.findOne({
            bulk_request_id: request._id,
            farmer_id: farmer._id,
            status: "pending",
          }).select(
            "crop_id quantity price status"
          );

        return {
          request_id:
            request._id,

          crop_name:
            request.crop_name,

          requested_quantity:
            request.requested_quantity,

          remaining_quantity:
            request.remaining_quantity,

          target_price:
            request.target_price,

          status:
            request.status,

          created_at:
            request.createdAt,

          buyer:
            request.buyer_id
              ? {
                  company_name:
                    request.buyer_id
                      .company_name || "",

                  location:
                    request.buyer_id
                      .location || "",
                }
              : null,

          available_quantity:
            totalAvailable,

          matching_crops:
            matchingCrops.map(
              (crop) => ({
                crop_id: crop._id,
                quantity: crop.quantity,
                price: crop.price,
              })
            ),

          existing_offer:
            existingOffer || null,
        };
      })
    );

    return res.json(result);
  } catch (error) {
    console.error(
      "Get farmer bulk requests error:",
      error
    );

    return res.status(500).json({
      error:
        "Failed to fetch farmer bulk requests",
    });
  }
};

// ==========================================
// SUBMIT FARMER BULK OFFER
// ==========================================
// Farmer submits:
//
// crop_id
// quantity
// price
//
// POST
// /api/bulk-requests/:requestId/offers
// ==========================================
exports.submitBulkOffer = async (
  req,
  res
) => {
  try {
    const { requestId } = req.params;

    const {
      crop_id,
      quantity,
      price,
    } = req.body;

    // ------------------------------------------
    // Validate request ID
    // ------------------------------------------
    if (
      !requestId ||
      !mongoose.Types.ObjectId.isValid(
        requestId
      )
    ) {
      return res.status(400).json({
        error:
          "Invalid bulk request ID",
      });
    }

    // ------------------------------------------
    // Validate crop ID
    // ------------------------------------------
    if (
      !crop_id ||
      !mongoose.Types.ObjectId.isValid(
        crop_id
      )
    ) {
      return res.status(400).json({
        error:
          "Valid crop_id is required",
      });
    }

    // ------------------------------------------
    // Validate quantity
    // ------------------------------------------
    const offeredQuantity =
      Number(quantity);

    if (
      !Number.isFinite(offeredQuantity) ||
      offeredQuantity <= 0
    ) {
      return res.status(400).json({
        error:
          "Offer quantity must be greater than 0",
      });
    }

    // ------------------------------------------
    // Validate price
    // ------------------------------------------
    const offeredPrice =
      Number(price);

    if (
      !Number.isFinite(offeredPrice) ||
      offeredPrice < 0
    ) {
      return res.status(400).json({
        error:
          "Offer price must be a valid number",
      });
    }

    // ------------------------------------------
    // Find farmer
    // ------------------------------------------
    const farmer = await Farmer.findOne({
      user_id: req.user.user_id,
    });

    if (!farmer) {
      return res.status(403).json({
        error:
          "Only registered farmers can submit offers",
      });
    }

    // ------------------------------------------
    // Find bulk request
    // ------------------------------------------
    const bulkRequest =
      await BulkOrderRequest.findById(
        requestId
      );

    if (!bulkRequest) {
      return res.status(404).json({
        error:
          "Bulk request not found",
      });
    }

    // ------------------------------------------
    // Check request status
    // ------------------------------------------
    if (
      ![
        "open",
        "partially_fulfilled",
      ].includes(bulkRequest.status)
    ) {
      return res.status(400).json({
        error:
          "This bulk request is no longer accepting offers",
      });
    }

    // ------------------------------------------
    // Check remaining quantity
    // ------------------------------------------
    if (
      offeredQuantity >
      bulkRequest.remaining_quantity
    ) {
      return res.status(400).json({
        error:
          `You can offer maximum ${bulkRequest.remaining_quantity} kg`,
      });
    }

    // ------------------------------------------
    // Find farmer's crop
    // ------------------------------------------
    const crop =
      await Crop.findOne({
        _id: crop_id,
        farmer_id: farmer._id,
        status: "available",
        quantity: { $gt: 0 },
      });

    if (!crop) {
      return res.status(404).json({
        error:
          "This crop does not belong to you or is not available",
      });
    }

    // ------------------------------------------
    // Check crop name
    // ------------------------------------------
    if (
      crop.crop_name.toLowerCase() !==
      bulkRequest.crop_name.toLowerCase()
    ) {
      return res.status(400).json({
        error:
          "Selected crop does not match the bulk request",
      });
    }

    // ------------------------------------------
    // Check farmer stock
    // ------------------------------------------
    if (
      offeredQuantity >
      crop.quantity
    ) {
      return res.status(400).json({
        error:
          `You only have ${crop.quantity} kg available`,
      });
    }

    // ------------------------------------------
    // Prevent duplicate pending offer
    // ------------------------------------------
    const existingOffer =
      await BulkOrderOffer.findOne({
        bulk_request_id: bulkRequest._id,
        farmer_id: farmer._id,
        crop_id: crop._id,
        status: "pending",
      });

    if (existingOffer) {
      return res.status(409).json({
        error:
          "You already have a pending offer for this crop",
      });
    }

    // ------------------------------------------
    // Calculate total amount
    // ------------------------------------------
    const totalAmount =
      offeredQuantity * offeredPrice;

    // ------------------------------------------
    // Save offer
    // ------------------------------------------
    const offer =
      await BulkOrderOffer.create({
        bulk_request_id:
          bulkRequest._id,

        farmer_id:
          farmer._id,

        crop_id:
          crop._id,

        quantity:
          offeredQuantity,

        price:
          offeredPrice,

        total_amount:
          totalAmount,

        status:
          "pending",
      });

    // ------------------------------------------
    // Notify buyer
    // ------------------------------------------
    const buyer = await Buyer.findById(
      bulkRequest.buyer_id
    ).select("user_id");

    if (buyer) {
      await Notification.create({
        user_id: buyer.user_id,
        related_user_id: req.user.user_id,
        message:
          `A farmer submitted an offer of ${offeredQuantity}kg ${bulkRequest.crop_name} at ₹${offeredPrice}/kg for your bulk request.`,
        type: "bulk_offer",
      });
    }

    // ------------------------------------------
    // Response
    // ------------------------------------------
    return res.status(201).json({
      message:
        "Bulk offer submitted successfully",

      offer: {
        offer_id:
          offer._id,

        request_id:
          offer.bulk_request_id,

        farmer_id:
          offer.farmer_id,

        crop_id:
          offer.crop_id,

        quantity:
          offer.quantity,

        price:
          offer.price,

        total_amount:
          offer.total_amount,

        status:
          offer.status,
      },
    });
  } catch (error) {
    console.error(
      "Submit bulk offer error:",
      error
    );

    return res.status(500).json({
      error:
        "Failed to submit bulk offer",
    });
  }
};