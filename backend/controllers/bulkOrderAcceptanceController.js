const mongoose = require("mongoose");

const BulkOrderRequest = require("../models/BulkOrderRequest");
const BulkOrderOffer = require("../models/BulkOrderOffer");
const Buyer = require("../models/Buyer");
const Crop = require("../models/Crop");
const Farmer = require("../models/Farmer");
const Order = require("../models/Order");
const Notification = require("../models/Notification");

// ==========================================
// GET OFFERS FOR BUYER
// ==========================================

exports.getBulkRequestOffers = async (
  req,
  res
) => {
  try {
    const { requestId } = req.params;

    // ==========================================
    // VALIDATE REQUEST ID
    // ==========================================

    if (
      !requestId ||
      !mongoose.Types.ObjectId.isValid(
        requestId
      )
    ) {
      return res.status(400).json({
        error: "Invalid bulk request ID",
      });
    }

    // ==========================================
    // FIND BUYER
    // ==========================================

    const buyer = await Buyer.findOne({
      user_id: req.user.user_id,
    });

    if (!buyer) {
      return res.status(403).json({
        error:
          "Only registered buyers can view bulk offers",
      });
    }

    // ==========================================
    // FIND REQUEST
    // ==========================================

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

    // ==========================================
    // FIND OFFERS
    // ==========================================

    const offers =
      await BulkOrderOffer.find({
        bulk_request_id:
          bulkRequest._id,
      })
        .populate({
          path: "farmer_id",
          select:
            "user_id village district state",
          populate: {
            path: "user_id",
            select:
              "name email phone",
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

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.json({
      request: {
        request_id:
          bulkRequest._id,

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

        delivery_address:
          bulkRequest.delivery_address,

        created_at:
          bulkRequest.createdAt,
      },

      offers,
    });
  } catch (error) {
    console.error(
      "Get bulk request offers error:",
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
//
// Buyer selects multiple farmer offers.
//
// Example:
//
// Required = 500 kg
//
// Farmer A = 200 kg
// Farmer B = 150 kg
// Farmer C = 150 kg
//
// Buyer selects all three.
//
// Final Order:
//
// 500 kg
// 3 farmer allocations
//
// ==========================================

exports.acceptBulkOffers = async (
  req,
  res
) => {
  const session =
    await mongoose.startSession();

  try {
    const { requestId } =
      req.params;

    const { offer_ids } =
      req.body;

    // ==========================================
    // VALIDATE REQUEST ID
    // ==========================================

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

    // ==========================================
    // VALIDATE OFFER IDS
    // ==========================================

    if (
      !Array.isArray(offer_ids) ||
      offer_ids.length === 0
    ) {
      return res.status(400).json({
        error:
          "Please select at least one offer",
      });
    }

    const invalidOfferId =
      offer_ids.some(
        (id) =>
          !mongoose.Types.ObjectId.isValid(
            id
          )
      );

    if (invalidOfferId) {
      return res.status(400).json({
        error:
          "One or more offer IDs are invalid",
      });
    }

    // ==========================================
    // REMOVE DUPLICATES
    // ==========================================

    const uniqueOfferIds = [
      ...new Set(
        offer_ids.map((id) =>
          String(id)
        )
      ),
    ];

    // ==========================================
    // FIND BUYER
    // ==========================================

    const buyer = await Buyer.findOne({
      user_id: req.user.user_id,
    });

    if (!buyer) {
      return res.status(403).json({
        error:
          "Only registered buyers can accept bulk offers",
      });
    }

    // ==========================================
    // FIND BULK REQUEST
    // ==========================================

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

    // ==========================================
    // CHECK REQUEST STATUS
    // ==========================================

    if (
      ![
        "open",
        "partially_fulfilled",
      ].includes(
        bulkRequest.status
      )
    ) {
      return res.status(400).json({
        error:
          "This bulk request is no longer accepting offers",
      });
    }

    // ==========================================
    // CHECK REMAINING QUANTITY
    // ==========================================

    if (
      Number(
        bulkRequest.remaining_quantity
      ) <= 0
    ) {
      return res.status(400).json({
        error:
          "This bulk request is already fulfilled",
      });
    }

    // ==========================================
    // FIND SELECTED OFFERS
    // ==========================================

    const offers =
      await BulkOrderOffer.find({
        _id: {
          $in: uniqueOfferIds,
        },

        bulk_request_id:
          bulkRequest._id,

        status: "pending",
      });

    // ==========================================
    // MAKE SURE EVERY SELECTED OFFER EXISTS
    // ==========================================

    if (
      offers.length !==
      uniqueOfferIds.length
    ) {
      return res.status(400).json({
        error:
          "One or more selected offers are no longer available",
      });
    }

    // ==========================================
    // CALCULATE SELECTED QUANTITY
    // ==========================================

    const selectedQuantity =
      offers.reduce(
        (sum, offer) =>
          sum +
          Number(
            offer.quantity
          ),
        0
      );

    const remainingQuantity =
      Number(
        bulkRequest.remaining_quantity
      );

    // ==========================================
    // REQUIRE FULL REMAINING QUANTITY
    // ==========================================
    //
    // We create the final Order only when
    // selected farmer offers completely
    // fulfill the remaining requirement.
    //
    // ==========================================

    if (
      selectedQuantity !==
      remainingQuantity
    ) {
      return res.status(400).json({
        error:
          `Selected offers provide ${selectedQuantity} kg, but ${remainingQuantity} kg is required.`,
        selected_quantity:
          selectedQuantity,
        required_quantity:
          remainingQuantity,
      });
    }

    // ==========================================
    // START TRANSACTION
    // ==========================================

    session.startTransaction();

    // ==========================================
    // VERIFY AND RESERVE CROP STOCK
    // ==========================================

    const allocations = [];

    for (const offer of offers) {
      const crop =
        await Crop.findOne({
          _id: offer.crop_id,
          farmer_id:
            offer.farmer_id,
          status: "available",
          quantity: {
            $gte: offer.quantity,
          },
        }).session(session);

      // ----------------------------------------
      // Crop unavailable
      // ----------------------------------------

      if (!crop) {
        throw new Error(
          `Crop stock is no longer available for offer ${offer._id}`
        );
      }

      // ----------------------------------------
      // Create allocation
      // ----------------------------------------

      allocations.push({
        farmer_id:
          offer.farmer_id,

        crop_id:
          offer.crop_id,

        quantity:
          Number(
            offer.quantity
          ),

        price:
          Number(
            offer.price
          ),

        total_amount:
          Number(
            offer.total_amount
          ),
      });

      // ----------------------------------------
      // Reduce crop quantity
      // ----------------------------------------

      const updatedCrop =
        await Crop.findOneAndUpdate(
          {
            _id: crop._id,
            farmer_id:
              offer.farmer_id,
            status: "available",
            quantity: {
              $gte: offer.quantity,
            },
          },
          {
            $inc: {
              quantity:
                -Number(
                  offer.quantity
                ),
            },
          },
          {
            new: true,
            session,
          }
        );

      if (!updatedCrop) {
        throw new Error(
          `Unable to reserve crop stock for offer ${offer._id}`
        );
      }

      // ----------------------------------------
      // Mark sold out when quantity reaches 0
      // ----------------------------------------

      if (
        Number(
          updatedCrop.quantity
        ) <= 0
      ) {
        updatedCrop.quantity = 0;
        updatedCrop.status =
          "sold_out";

        await updatedCrop.save({
          session,
        });
      }
    }

    // ==========================================
    // CALCULATE FINAL ORDER TOTAL
    // ==========================================

    const totalAmount =
      allocations.reduce(
        (sum, allocation) =>
          sum +
          Number(
            allocation.total_amount
          ),
        0
      );

    // ==========================================
    // CREATE FINAL BULK ORDER
    // ==========================================

    const order = new Order({
      order_type: "bulk",

      buyer_id:
        buyer._id,

      quantity:
        selectedQuantity,

      total_amount:
        totalAmount,

      crop_name:
        bulkRequest.crop_name,

      allocations,

      delivery_address:
        bulkRequest.delivery_address,

      status:
        "pending",

      negotiation_status:
        "accepted",
    });

    await order.save({
      session,
    });

    // ==========================================
    // MARK SELECTED OFFERS ACCEPTED
    // ==========================================

    await BulkOrderOffer.updateMany(
      {
        _id: {
          $in: uniqueOfferIds,
        },

        bulk_request_id:
          bulkRequest._id,

        status: "pending",
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

    // ==========================================
    // REJECT OTHER PENDING OFFERS
    // ==========================================

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

    // ==========================================
    // MARK REQUEST FULFILLED
    // ==========================================

    bulkRequest.remaining_quantity = 0;

    bulkRequest.status =
      "fulfilled";

    await bulkRequest.save({
      session,
    });

    // ==========================================
    // COMMIT TRANSACTION
    // ==========================================

    await session.commitTransaction();

    // ==========================================
    // NOTIFY FARMERS
    // ==========================================

    for (const allocation of allocations) {
      try {
        const farmer =
          await Farmer.findById(
            allocation.farmer_id
          ).select("user_id");

        if (!farmer) {
          continue;
        }

        await Notification.create({
          user_id:
            farmer.user_id,

          related_user_id:
            req.user.user_id,

          message:
            `Your offer was accepted for ${allocation.quantity}kg of ${bulkRequest.crop_name} at ₹${allocation.price}/kg.`,

          type:
            "bulk_order",
        });

        // --------------------------------------
        // LOW STOCK NOTIFICATION
        // --------------------------------------

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

            related_user_id:
              req.user.user_id,

            message:
              `Low stock alert: only ${updatedCrop.quantity}kg of ${bulkRequest.crop_name} is left.`,

            type:
              "stock",
          });
        }
      } catch (notificationError) {
        console.error(
          "Farmer notification error:",
          notificationError
        );
      }
    }

    // ==========================================
    // NOTIFY BUYER
    // ==========================================

    await Notification.create({
      user_id:
        req.user.user_id,

      message:
        `Your bulk request for ${selectedQuantity}kg of ${bulkRequest.crop_name} has been fulfilled. Your final bulk order has been created.`,

      type:
        "bulk_order",
    });

    // ==========================================
    // SUCCESS RESPONSE
    // ==========================================

    return res.status(201).json({
      message:
        "Bulk offers accepted and final order created successfully",

      order_id:
        order._id,

      order_type:
        "bulk",

      crop_name:
        bulkRequest.crop_name,

      quantity:
        selectedQuantity,

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
    // ==========================================
    // ABORT TRANSACTION
    // ==========================================

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
        "Failed to accept bulk offers",
    });
  } finally {
    await session.endSession();
  }
};