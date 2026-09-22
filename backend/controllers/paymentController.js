const Payment = require("../models/Payment");
const Order = require("../models/Order");
const Buyer = require("../models/Buyer");
const Farmer = require("../models/Farmer");
const Crop = require("../models/Crop");
const { createNotification } = require("./notificationController");

// ==========================================
// BUYER CREATES PAYMENT
// ==========================================

exports.createPayment = async (req, res) => {
  try {
    const { order_id } = req.body;

    if (!order_id) {
      return res.status(400).json({
        error: "order_id is required",
      });
    }

    // ==========================================
    // FIND BUYER PROFILE
    // ==========================================

    const buyer = await Buyer.findOne({
      user_id: req.user.user_id,
    });

    if (!buyer) {
      return res.status(403).json({
        error: "Only registered buyers can make payments",
      });
    }

    // ==========================================
    // FIND ORDER
    // ==========================================

    const order = await Order.findById(order_id);

    if (!order) {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    // ==========================================
    // CHECK ORDER OWNERSHIP
    // ==========================================

    if (
      order.buyer_id.toString() !==
      buyer._id.toString()
    ) {
      return res.status(403).json({
        error:
          "You can only pay for your own orders",
      });
    }

    // ==========================================
    // PREVENT DUPLICATE PAYMENT
    // ==========================================

    const existingPayment =
      await Payment.findOne({
        order_id: order._id,
      });

    if (existingPayment) {
      return res.status(409).json({
        error:
          "Payment already exists for this order",
      });
    }

    // ==========================================
    // SIMULATE TRANSACTION ID
    // ==========================================

    const transaction_id =
      "TXN" + Date.now();

    // ==========================================
    // CREATE PAYMENT
    // ==========================================

    const payment =
      await Payment.create({
        order_id: order._id,
        amount: order.total_amount,
        payment_status: "held",
        transaction_id,
      });

    // ==========================================
    // CONFIRM ORDER
    // ==========================================

    order.status = "confirmed";

    await order.save();

    // ==========================================
    // BULK ORDER PAYMENT
    // ==========================================

    if (
      order.order_type === "bulk"
    ) {
      /*
       * Bulk orders can contain multiple
       * farmer allocations.
       *
       * Notify every farmer involved
       * in this bulk order.
       */

      for (const allocation of order.allocations) {
        try {
          const farmer =
            await Farmer.findById(
              allocation.farmer_id
            );

          if (!farmer) {
            continue;
          }

          await createNotification(
            farmer.user_id,
            `Payment received and held for your bulk order allocation of ${allocation.quantity}kg ${order.crop_name}!`,
            "payment"
          );
        } catch (notificationError) {
          console.error(
            "Bulk farmer payment notification error:",
            notificationError
          );
        }
      }
    }

    // ==========================================
    // NORMAL SINGLE-FARMER ORDER PAYMENT
    // ==========================================

    else {
      const crop =
        await Crop.findById(
          order.crop_id
        );

      if (crop) {
        const farmer =
          await Farmer.findById(
            crop.farmer_id
          );

        if (farmer) {
          await createNotification(
            farmer.user_id,
            "Payment received and held for your order!",
            "payment"
          );
        }
      }
    }

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(201).json({
      message:
        "Payment successful, held in escrow",
      payment_id:
        payment._id,
      transaction_id,
    });

  } catch (error) {
    console.error(
      "Create payment error:",
      error
    );

    return res.status(500).json({
      error: "Payment failed",
    });
  }
};


// ==========================================
// FARMER UPDATES ORDER STATUS
// ==========================================

exports.updateOrderStatus = async (
  req,
  res
) => {
  try {
    const {
      order_id,
    } = req.params;

    const {
      status,
    } = req.body;

    // ==========================================
    // VALIDATE STATUS
    // ==========================================

    const validStatuses = [
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (
      !validStatuses.includes(status)
    ) {
      return res.status(400).json({
        error:
          "Invalid status value",
      });
    }

    // ==========================================
    // FIND FARMER PROFILE
    // ==========================================

    const farmer =
      await Farmer.findOne({
        user_id: req.user.user_id,
      });

    if (!farmer) {
      return res.status(403).json({
        error:
          "Only registered farmers can update order status",
      });
    }

    // ==========================================
    // FIND ORDER
    // ==========================================

    const order =
      await Order.findById(
        order_id
      );

    if (!order) {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    // ==========================================
    // BULK ORDER
    // ==========================================

    if (
      order.order_type === "bulk"
    ) {
      /*
       * A bulk order contains allocations
       * for multiple farmers.
       *
       * Check whether this farmer is
       * actually part of the order.
       */

      const farmerAllocation =
        order.allocations.find(
          (allocation) =>
            allocation.farmer_id
              .toString() ===
            farmer._id.toString()
        );

      if (!farmerAllocation) {
        return res.status(403).json({
          error:
            "You can only update bulk orders containing your own allocation",
        });
      }

      // ========================================
      // UPDATE BULK ORDER STATUS
      // ========================================

      order.status = status;

      await order.save();

      // ========================================
      // NOTIFY BUYER
      // ========================================

      const buyer =
        await Buyer.findById(
          order.buyer_id
        );

      if (buyer) {
        await createNotification(
          buyer.user_id,
          `Your bulk order status changed to: ${status}`,
          "order"
        );
      }

      // ========================================
      // RELEASE PAYMENT
      // ========================================

      if (
        status === "delivered"
      ) {
        await Payment.findOneAndUpdate(
          {
            order_id:
              order._id,
          },
          {
            payment_status:
              "released",
          }
        );
      }

      return res.json({
        message:
          `Bulk order status updated to '${status}'`,
      });
    }

    // ==========================================
    // NORMAL SINGLE ORDER
    // ==========================================

    const crop =
      await Crop.findById(
        order.crop_id
      );

    if (!crop) {
      return res.status(404).json({
        error: "Crop not found",
      });
    }

    // ==========================================
    // CHECK FARMER OWNERSHIP
    // ==========================================

    if (
      crop.farmer_id.toString() !==
      farmer._id.toString()
    ) {
      return res.status(403).json({
        error:
          "You can only update orders on your own crops",
      });
    }

    // ==========================================
    // UPDATE ORDER STATUS
    // ==========================================

    order.status = status;

    await order.save();

    // ==========================================
    // FIND BUYER
    // ==========================================

    const buyer =
      await Buyer.findById(
        order.buyer_id
      );

    if (buyer) {
      await createNotification(
        buyer.user_id,
        `Your order status changed to: ${status}`,
        "order"
      );
    }

    // ==========================================
    // RELEASE PAYMENT WHEN DELIVERED
    // ==========================================

    if (
      status === "delivered"
    ) {
      await Payment.findOneAndUpdate(
        {
          order_id:
            order._id,
        },
        {
          payment_status:
            "released",
        }
      );
    }

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.json({
      message:
        `Order status updated to '${status}'`,
    });

  } catch (error) {
    console.error(
      "Update order status error:",
      error
    );

    return res.status(500).json({
      error:
        "Failed to update order status",
    });
  }
};


// ==========================================
// GET PAYMENT FOR ORDER
// ==========================================

exports.getPaymentByOrder =
  async (req, res) => {
    try {
      const {
        order_id,
      } = req.params;

      const payment =
        await Payment.findOne({
          order_id,
        });

      if (!payment) {
        return res.status(404).json({
          error:
            "No payment found for this order",
        });
      }

      return res.json(payment);

    } catch (error) {
      console.error(
        "Get payment error:",
        error
      );

      return res.status(500).json({
        error:
          "Failed to fetch payment",
      });
    }
  };