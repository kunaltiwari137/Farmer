const mongoose = require("mongoose");

const BulkOrderRequest = require("../models/BulkOrderRequest");
const BulkOrderOffer = require("../models/BulkOrderOffer");
const Order = require("../models/Order");
const Buyer = require("../models/Buyer");
const Crop = require("../models/Crop");
const Farmer = require("../models/Farmer");
const Notification = require("../models/Notification");

// ==========================================
// GET OFFERS FOR BUYER
// ==========================================
// Buyer can see all offers submitted for
// their bulk request.
//
// GET
// /api/bulk-requests/:requestId/offers
// ==========================================
exports.getBulkOffers = async (req, res) => {
  try {
    const { requestId } = req.params;

    // ------------------------------------------
    // Validate request ID
    // ------------------------------------------
    if (
      !mongoose.Types.ObjectId.isValid(requestId)
    ) {
      return res.status(400).json({
        error: "Invalid bulk request ID",
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
          "Only registered buyers can view offers",
      });
    }

    // ------------------------------------------
    // Find request belonging to buyer
    // ------------------------------------------
    const bulkRequest =
      await BulkOrderRequest.findOne({
        _id: requestId,
        buyer_id: buyer._id,
      });

    if (!bulkRequest) {
      return res.status(404).json({
        error:
          "Bulk request not found",
      });
    }

    // ------------------------------------------
    // Find offers
    // ------------------------------------------
    const offers =
      await BulkOrderOffer.find({
        bulk_request_id: bulkRequest._id,
      })
        .populate({
          path: "farmer_id",
          select:
            "user_id village district state verified",
          populate: {
            path: "user_id",
            select: "name email phone",
          },
        })
        .populate({
          path: "crop_id",
          select:
            "crop_name quantity price status",
        })
        .sort({
          createdAt: -1,
        });

    return res.json({
      request: {
        request_id: bulkRequest._id,
        crop_name: bulkRequest.crop_name,
        requested_quantity:
          bulkRequest.requested_quantity,
        remaining_quantity:
          bulkRequest.remaining_quantity,
        target_price:
          bulkRequest.target_price,
        status: bulkRequest.status,
        delivery_address:
          bulkRequest.delivery_address,
      },
      offers,
    });
  } catch (error) {
    console.error(
      "Get bulk offers error:",
      error
    );

    return res.status(500).json({
      error:
        "Failed to fetch bulk offers",
    });
  }
};

// ==========================================
// ACCEPT MULTIPLE BULK OFFERS
// ==========================================
// Buyer selects multiple farmer offers.
//
// Example:
//
// {
//   "offer_ids": [
//     "offerId1",
//     "offerId2",
//     "offerId3"
//   ]
// }
//
// The selected offers must completely fulfill
// the remaining quantity.
//
// One final bulk Order is created with
// multiple farmer allocations.
//
// POST
// /api/bulk-requests/:requestId/accept-offers
// ==========================================
exports.acceptBulkOffers = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { requestId } = req.params;
    const { offer_ids } = req.body;

    // ------------------------------------------
    // Validate request ID
    // ------------------------------------------
    if (
      !mongoose.Types.ObjectId.isValid(requestId)
    ) {
      return res.status(400).json({
        error: "Invalid bulk request ID",
      });
    }

    // ------------------------------------------
    // Validate offer IDs
    // ------------------------------------------
    if (
      !Array.isArray(offer_ids) ||
      offer_ids.length === 0
    ) {
      return res.status(400).json({
        error:
          "At least one offer must be selected",
      });
    }

    const invalidOfferId =
      offer_ids.some(
        (id) =>
          !mongoose.Types.ObjectId.isValid(id)
      );

    if (invalidOfferId) {
      return res.status(400).json({
        error:
          "One or more offer IDs are invalid",
      });
    }

    // ------------------------------------------
    // Remove duplicate IDs
    // ------------------------------------------
    const uniqueOfferIds = [
      ...new Set(
        offer_ids.map((id) => String(id))
      ),
    ];

    // ------------------------------------------
    // Find buyer
    // ------------------------------------------
    const buyer = await Buyer.findOne({
      user_id: req.user.user_id,
    });

    if (!buyer) {
      return res.status(403).json({
        error:
          "Only registered buyers can accept offers",
      });
    }

    // ------------------------------------------
    // Find bulk request
    // ------------------------------------------
    const bulkRequest =
      await BulkOrderRequest.findOne({
        _id: requestId,
        buyer_id: buyer._id,
      });

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
    // Find selected offers
    // ------------------------------------------
    const offers =
      await BulkOrderOffer.find({
        _id: {
          $in: uniqueOfferIds,
        },
        bulk_request_id:
          bulkRequest._id,
        status: "pending",
      }).session(session);

    // ------------------------------------------
    // Make sure all selected offers exist
    // ------------------------------------------
    if (
      offers.length !== uniqueOfferIds.length
    ) {
      return res.status(400).json({
        error:
          "One or more selected offers are no longer available",
      });
    }

    // ------------------------------------------
    // Calculate selected quantity
    // ------------------------------------------
    const selectedQuantity =
      offers.reduce(
        (sum, offer) =>
          sum + Number(offer.quantity),
        0
      );

    const remainingQuantity =
      Number(
        bulkRequest.remaining_quantity
      );

    // ------------------------------------------
    // Selected quantity cannot exceed request
    // ------------------------------------------
    if (
      selectedQuantity >
      remainingQuantity
    ) {
      return res.status(400).json({
        error:
          `Selected offers contain ${selectedQuantity} kg, but only ${remainingQuantity} kg is required`,
        selected_quantity:
          selectedQuantity,
        remaining_quantity:
          remainingQuantity,
      });
    }

    // ------------------------------------------
    // Require complete fulfillment
    // ------------------------------------------
    if (
      selectedQuantity !==
      remainingQuantity
    ) {
      return res.status(400).json({
        error:
          `Please select offers totaling exactly ${remainingQuantity} kg`,
        selected_quantity:
          selectedQuantity,
        required_quantity:
          remainingQuantity,
      });
    }

    // ------------------------------------------
    // Start transaction
    // ------------------------------------------
    session.startTransaction();

    // ------------------------------------------
    // Re-check every crop stock
    // ------------------------------------------
    const allocations = [];

    for (const offer of offers) {
      const crop =
        await Crop.findOne({
          _id: offer.crop_id,
          farmer_id: offer.farmer_id,
          status: "available",
          quantity: {
            $gte: offer.quantity,
          },
        }).session(session);

      if (!crop) {
        throw new Error(
          `Crop for offer ${offer._id} is no longer available in sufficient quantity`
        );
      }

      allocations.push({
        farmer_id:
          offer.farmer_id,

        crop_id:
          offer.crop_id,

        quantity:
          Number(offer.quantity),

        price:
          Number(offer.price),

        total_amount:
          Number(offer.total_amount),
      });
    }

    // ------------------------------------------
    // Calculate final order amount
    // ------------------------------------------
    const totalAmount =
      allocations.reduce(
        (sum, allocation) =>
          sum +
          Number(
            allocation.total_amount
          ),
        0
      );

    // ------------------------------------------
    // Create final bulk order
    // ------------------------------------------
    const order = new Order({
      order_type: "bulk",

      buyer_id:
        buyer._id,

      quantity:
        remainingQuantity,

      total_amount:
        totalAmount,

      crop_name:
        bulkRequest.crop_name,

      allocations,

      delivery_address:
        bulkRequest.delivery_address,

      status:
        "pending",
    });

    await order.save({
      session,
    });

    // ------------------------------------------
    // Reduce crop stock
    // ------------------------------------------
    for (const allocation of allocations) {
      const updatedCrop =
        await Crop.findOneAndUpdate(
          {
            _id: allocation.crop_id,
            farmer_id:
              allocation.farmer_id,
            status: "available",
            quantity: {
              $gte: allocation.quantity,
            },
          },
          {
            $inc: {
              quantity:
                -allocation.quantity,
            },
          },
          {
            new: true,
            session,
          }
        );

      if (!updatedCrop) {
        throw new Error(
          `Unable to update crop ${allocation.crop_id}`
        );
      }

      // ----------------------------------------
      // Mark sold out when stock reaches zero
      // ----------------------------------------
      if (
        updatedCrop.quantity <= 0
      ) {
        updatedCrop.status =
          "sold_out";

        await updatedCrop.save({
          session,
        });
      }
    }

    // ------------------------------------------
    // Mark selected offers as accepted
    // ------------------------------------------
    await BulkOrderOffer.updateMany(
      {
        _id: {
          $in: uniqueOfferIds,
        },
      },
      {
        $set: {
          status: "accepted",
        },
      },
      {
        session,
      }
    );

    // ------------------------------------------
    // Reject remaining pending offers
    // ------------------------------------------
    await BulkOrderOffer.updateMany(
      {
        bulk_request_id:
          bulkRequest._id,

        status: "pending",

        _id: {
          $nin: uniqueOfferIds,
        },
      },
      {
        $set: {
          status: "rejected",
        },
      },
      {
        session,
      }
    );

    // ------------------------------------------
    // Mark bulk request fulfilled
    // ------------------------------------------
    bulkRequest.remaining_quantity = 0;

    bulkRequest.status =
      "fulfilled";

    await bulkRequest.save({
      session,
    });

    // ------------------------------------------
    // Commit transaction
    // ------------------------------------------
    await session.commitTransaction();

    // ==========================================
    // NOTIFICATIONS
    // ==========================================

    // ------------------------------------------
    // Notify selected farmers
    // ------------------------------------------
    for (const allocation of allocations) {
      const farmer =
        await Farmer.findById(
          allocation.farmer_id
        );

      if (!farmer) {
        continue;
      }

      await Notification.create({
        user_id:
          farmer.user_id,

        related_user_id:
          req.user.user_id,

        message:
          `Your offer for ${allocation.quantity}kg of ${bulkRequest.crop_name} was accepted. A bulk order has been created.`,

        type:
          "order",
      });

      // ----------------------------------------
      // Low stock notification
      // ----------------------------------------
      const updatedCrop =
        await Crop.findById(
          allocation.crop_id
        );

      if (
        updatedCrop &&
        updatedCrop.quantity > 0 &&
        updatedCrop.quantity <= 10
      ) {
        await Notification.create({
          user_id:
            farmer.user_id,

          message:
            `Low stock alert: only ${updatedCrop.quantity}kg of ${bulkRequest.crop_name} left!`,

          type:
            "stock",
        });
      }
    }

    // ------------------------------------------
    // Notify buyer
    // ------------------------------------------
    await Notification.create({
      user_id:
        req.user.user_id,

      message:
        `Your bulk order for ${remainingQuantity}kg of ${bulkRequest.crop_name} has been created successfully.`,

      type:
        "order",
    });

    // ==========================================
    // SUCCESS RESPONSE
    // ==========================================
    return res.status(201).json({
      message:
        "Bulk offers accepted and order created successfully",

      order_id:
        order._id,

      order_type:
        "bulk",

      crop_name:
        bulkRequest.crop_name,

      quantity:
        remainingQuantity,

      total_amount:
        totalAmount,

      farmers_count:
        allocations.length,

      allocations:
        allocations.map(
          (allocation) => ({
            farmer_id:
              allocation.farmer_id,

            crop_id:
              allocation.crop_id,

            quantity:
              allocation.quantity,

            price:
              allocation.price,

            total_amount:
              allocation.total_amount,
          })
        ),
    });
  } catch (error) {
    // ------------------------------------------
    // Abort transaction
    // ------------------------------------------
    if (
      session.inTransaction()
    ) {
      await session.abortTransaction();
    }

    console.error(
      "Accept bulk offers error:",
      error
    );

    return res.status(500).json({
      error:
        error.message ||
        "Failed to accept bulk offers",
    });
  } finally {
    await session.endSession();
  }
};