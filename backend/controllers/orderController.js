const mongoose = require("mongoose");

const Order = require("../models/Order");
const Crop = require("../models/Crop");
const Buyer = require("../models/Buyer");
const Farmer = require("../models/Farmer");
const Notification = require("../models/Notification");

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

  // Phone validation
  const phone = String(address.phone).replace(/\D/g, "");

  if (phone.length !== 10) {
    return "Phone number must be 10 digits";
  }

  // Pincode validation
  const pincode = String(address.pincode).trim();

  if (!/^\d{6}$/.test(pincode)) {
    return "Pincode must be 6 digits";
  }

  return null;
};

// ==========================================
// CLEAN DELIVERY ADDRESS
// ==========================================
const cleanAddress = (delivery_address) => {
  return {
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
  };
};

// ==========================================
// CREATE NORMAL SINGLE-FARMER ORDER
// ==========================================
exports.createOrder = async (req, res) => {
  try {
    const {
      crop_id,
      quantity,
      delivery_address,
    } = req.body;

    // ==========================================
    // BASIC VALIDATION
    // ==========================================
    if (!crop_id || !quantity) {
      return res.status(400).json({
        error: "crop_id and quantity are required",
      });
    }

    // ==========================================
    // VALIDATE DELIVERY ADDRESS
    // ==========================================
    const addressError = validateAddress(delivery_address);

    if (addressError) {
      return res.status(400).json({
        error: addressError,
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
        error: "Only registered buyers can place orders",
      });
    }

    // ==========================================
    // FIND CROP
    // ==========================================
    const crop = await Crop.findById(crop_id);

    if (!crop) {
      return res.status(404).json({
        error: "Crop not found",
      });
    }

    // ==========================================
    // CHECK CROP STATUS
    // ==========================================
    if (crop.status !== "available") {
      return res.status(400).json({
        error: "This crop is no longer available",
      });
    }

    // ==========================================
    // CHECK QUANTITY
    // ==========================================
    const orderQuantity = Number(quantity);

    if (orderQuantity <= 0) {
      return res.status(400).json({
        error: "Quantity must be greater than 0",
      });
    }

    if (orderQuantity > crop.quantity) {
      return res.status(400).json({
        error: `Only ${crop.quantity} kg available`,
      });
    }

    // ==========================================
    // CALCULATE TOTAL
    // ==========================================
    const total_amount = orderQuantity * crop.price;

    // ==========================================
    // CREATE ORDER
    // ==========================================
    const order = await Order.create({
      order_type: "single",

      crop_id: crop._id,

      buyer_id: buyer._id,

      quantity: orderQuantity,

      total_amount,

      delivery_address: cleanAddress(delivery_address),

      status: "pending",
    });

    // ==========================================
    // FIND FARMER
    // ==========================================
    const farmer = await Farmer.findById(crop.farmer_id);

    // ==========================================
    // NOTIFY FARMER
    // ==========================================
    if (farmer) {
      await Notification.create({
        user_id: farmer.user_id,
        related_user_id: req.user.user_id,
        message: `New order: ${orderQuantity}kg of your ${crop.crop_name} was ordered!`,
        type: "order",
      });
    }

    // ==========================================
    // REDUCE CROP QUANTITY
    // ==========================================
    const remaining = crop.quantity - orderQuantity;

    crop.quantity = remaining;

    if (remaining <= 0) {
      crop.status = "sold_out";
    } else {
      crop.status = "available";
    }

    await crop.save();

    // ==========================================
    // LOW STOCK NOTIFICATION
    // ==========================================
    if (farmer && remaining > 0 && remaining <= 10) {
      await Notification.create({
        user_id: farmer.user_id,
        message: `Low stock alert: only ${remaining}kg of ${crop.crop_name} left!`,
        type: "stock",
      });
    }

    // ==========================================
    // SUCCESS RESPONSE
    // ==========================================
    res.status(201).json({
      message: "Order placed successfully",
      order_id: order._id,
      order_type: "single",
      total_amount,
    });

  } catch (error) {
    console.error("Create order error:", error);

    res.status(500).json({
      error: "Failed to place order",
    });
  }
};

// ==========================================
// CREATE BULK / MULTI-FARMER ORDER
// ==========================================
exports.createBulkOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const {
      crop_name,
      quantity,
      delivery_address,
    } = req.body;

    // ==========================================
    // BASIC VALIDATION
    // ==========================================
    if (!crop_name || !String(crop_name).trim()) {
      return res.status(400).json({
        error: "crop_name is required",
      });
    }

    const requestedQuantity = Number(quantity);

    if (
      !Number.isFinite(requestedQuantity) ||
      requestedQuantity <= 0
    ) {
      return res.status(400).json({
        error: "Quantity must be greater than 0",
      });
    }

    // ==========================================
    // VALIDATE DELIVERY ADDRESS
    // ==========================================
    const addressError = validateAddress(delivery_address);

    if (addressError) {
      return res.status(400).json({
        error: addressError,
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
        error: "Only registered buyers can place orders",
      });
    }

    // ==========================================
    // FIND AVAILABLE CROPS
    //
    // Case-insensitive crop name matching.
    // ==========================================
    const requestedCropName = String(crop_name).trim();

    const availableCrops = await Crop.find({
      crop_name: {
        $regex: `^${requestedCropName.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        )}$`,
        $options: "i",
      },

      status: "available",

      quantity: {
        $gt: 0,
      },
    })
      .sort({
        createdAt: 1,
      })
      .session(session);

    if (!availableCrops.length) {
      return res.status(404).json({
        error: `No available ${requestedCropName} found`,
      });
    }

    // ==========================================
    // CHECK TOTAL AVAILABLE QUANTITY
    // ==========================================
    const totalAvailable = availableCrops.reduce(
      (sum, crop) => sum + Number(crop.quantity),
      0
    );

    if (totalAvailable < requestedQuantity) {
      return res.status(400).json({
        error: `Only ${totalAvailable} kg of ${requestedCropName} is available across all farmers`,
        requested_quantity: requestedQuantity,
        available_quantity: totalAvailable,
      });
    }

    // ==========================================
    // CREATE ALLOCATIONS
    // ==========================================
    let remainingQuantity = requestedQuantity;

    const allocations = [];

    for (const crop of availableCrops) {
      if (remainingQuantity <= 0) {
        break;
      }

      const availableQuantity = Number(crop.quantity);

      const allocatedQuantity = Math.min(
        remainingQuantity,
        availableQuantity
      );

      const allocationTotal =
        allocatedQuantity * Number(crop.price);

      allocations.push({
        farmer_id: crop.farmer_id,
        crop_id: crop._id,
        quantity: allocatedQuantity,
        price: Number(crop.price),
        total_amount: allocationTotal,
      });

      remainingQuantity -= allocatedQuantity;
    }

    // ==========================================
    // SAFETY CHECK
    // ==========================================
    if (remainingQuantity > 0) {
      return res.status(400).json({
        error: "Unable to fulfill the requested quantity",
      });
    }

    // ==========================================
    // CALCULATE TOTAL
    // ==========================================
    const totalAmount = allocations.reduce(
      (sum, allocation) =>
        sum + Number(allocation.total_amount),
      0
    );

    // ==========================================
    // START TRANSACTION
    // ==========================================
    session.startTransaction();

    // ==========================================
    // CREATE BULK ORDER
    // ==========================================
    const order = new Order({
      order_type: "bulk",

      buyer_id: buyer._id,

      quantity: requestedQuantity,

      total_amount: totalAmount,

      crop_name: requestedCropName,

      allocations,

      delivery_address: cleanAddress(delivery_address),

      status: "pending",
    });

    await order.save({
      session,
    });

    // ==========================================
    // UPDATE EVERY FARMER'S CROP
    // ==========================================
    for (const allocation of allocations) {
      const crop = availableCrops.find(
        (item) =>
          String(item._id) ===
          String(allocation.crop_id)
      );

      if (!crop) {
        throw new Error(
          `Crop ${allocation.crop_id} could not be found`
        );
      }

      const remaining =
        Number(crop.quantity) -
        Number(allocation.quantity);

      crop.quantity = remaining;

      if (remaining <= 0) {
        crop.status = "sold_out";
      } else {
        crop.status = "available";
      }

      await crop.save({
        session,
      });
    }

    // ==========================================
    // COMMIT TRANSACTION
    // ==========================================
    await session.commitTransaction();

    // ==========================================
    // FARMER NOTIFICATIONS
    // Do this after successful transaction.
    // ==========================================
    for (const allocation of allocations) {
      const farmer = await Farmer.findById(
        allocation.farmer_id
      );

      if (!farmer) {
        continue;
      }

      await Notification.create({
        user_id: farmer.user_id,

        related_user_id: req.user.user_id,

        message: `Bulk order: ${allocation.quantity}kg of ${requestedCropName} was ordered from your crop.`,

        type: "order",
      });

      // ==========================================
      // LOW STOCK NOTIFICATION
      // ==========================================
      const updatedCrop = await Crop.findById(
        allocation.crop_id
      );

      if (
        updatedCrop &&
        updatedCrop.quantity > 0 &&
        updatedCrop.quantity <= 10
      ) {
        await Notification.create({
          user_id: farmer.user_id,

          message: `Low stock alert: only ${updatedCrop.quantity}kg of ${requestedCropName} left!`,

          type: "stock",
        });
      }
    }

    // ==========================================
    // SUCCESS
    // ==========================================
    return res.status(201).json({
      message: "Bulk order placed successfully",

      order_id: order._id,

      order_type: "bulk",

      crop_name: requestedCropName,

      requested_quantity: requestedQuantity,

      total_amount: totalAmount,

      farmers_count: allocations.length,

      allocations: allocations.map(
        (allocation) => ({
          farmer_id: allocation.farmer_id,

          crop_id: allocation.crop_id,

          quantity: allocation.quantity,

          price: allocation.price,

          total_amount: allocation.total_amount,
        })
      ),
    });

  } catch (error) {
    // ==========================================
    // ABORT TRANSACTION
    // ==========================================
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    console.error(
      "Create bulk order error:",
      error
    );

    return res.status(500).json({
      error: "Failed to place bulk order",
    });

  } finally {
    await session.endSession();
  }
};

// ==========================================
// GET BUYER ORDERS
// ==========================================
exports.getMyOrders = async (req, res) => {
  try {
    const buyer = await Buyer.findOne({
      user_id: req.user.user_id,
    });

    if (!buyer) {
      return res.status(403).json({
        error: "Only registered buyers can view orders",
      });
    }

    const orders = await Order.find({
      buyer_id: buyer._id,
    })
      .populate("crop_id", "crop_name")
      .populate(
        "allocations.crop_id",
        "crop_name"
      )
      .populate(
        "allocations.farmer_id",
        "user_id"
      )
      .sort({ createdAt: -1 });

    const result = orders.map((order) => ({
      order_id: order._id,

      order_type: order.order_type,

      quantity: order.quantity,

      total_amount: order.total_amount,

      status: order.status,

      order_date: order.createdAt,

      crop_name:
        order.order_type === "bulk"
          ? order.crop_name
          : order.crop_id
            ? order.crop_id.crop_name
            : null,

      crop_id:
        order.order_type === "single"
          ? order.crop_id
            ? order.crop_id._id
            : null
          : null,

      // ==========================================
      // BULK ALLOCATIONS
      // ==========================================
      allocations:
        order.order_type === "bulk"
          ? order.allocations
          : [],

      // ==========================================
      // DELIVERY ADDRESS
      // ==========================================
      delivery_address:
        order.delivery_address,
    }));

    res.json(result);

  } catch (error) {
    console.error(
      "Get buyer orders error:",
      error
    );

    res.status(500).json({
      error: "Failed to fetch orders",
    });
  }
};

// ==========================================
// GET FARMER ORDERS
// ==========================================
exports.getFarmerOrders = async (req, res) => {
  try {
    const farmer = await Farmer.findOne({
      user_id: req.user.user_id,
    });

    if (!farmer) {
      return res.status(403).json({
        error: "Only registered farmers can view orders",
      });
    }

    // ==========================================
    // SINGLE ORDER CROPS
    // ==========================================
    const crops = await Crop.find({
      farmer_id: farmer._id,
    }).select("_id crop_name");

    const cropIds = crops.map(
      (crop) => crop._id
    );

    // ==========================================
    // NORMAL SINGLE-FARMER ORDERS
    // ==========================================
    const singleOrders = await Order.find({
      order_type: "single",

      crop_id: {
        $in: cropIds,
      },
    })
      .populate(
        "crop_id",
        "crop_name"
      )
      .populate({
        path: "buyer_id",
        select: "company_name",
      })
      .sort({ createdAt: -1 });

    // ==========================================
    // BULK ORDERS
    // ==========================================
    const bulkOrders = await Order.find({
      order_type: "bulk",

      "allocations.farmer_id":
        farmer._id,
    })
      .populate(
        "allocations.crop_id",
        "crop_name"
      )
      .populate({
        path: "buyer_id",
        select: "company_name",
      })
      .sort({ createdAt: -1 });

    // ==========================================
    // NORMAL ORDER RESULT
    // ==========================================
    const normalResults = singleOrders.map(
      (order) => ({
        order_id: order._id,

        order_type: "single",

        quantity: order.quantity,

        total_amount: order.total_amount,

        status: order.status,

        order_date: order.createdAt,

        crop_name:
          order.crop_id
            ? order.crop_id.crop_name
            : null,

        company_name:
          order.buyer_id
            ? order.buyer_id.company_name
            : null,

        delivery_address:
          order.delivery_address,
      })
    );

    // ==========================================
    // BULK ORDER RESULT
    // Only return this farmer's allocation.
    // ==========================================
    const bulkResults = [];

    for (const order of bulkOrders) {
      const farmerAllocations =
        order.allocations.filter(
          (allocation) =>
            String(
              allocation.farmer_id
            ) === String(farmer._id)
        );

      for (const allocation of farmerAllocations) {
        bulkResults.push({
          order_id: order._id,

          order_type: "bulk",

          quantity: allocation.quantity,

          total_amount:
            allocation.total_amount,

          status: order.status,

          order_date: order.createdAt,

          crop_name:
            allocation.crop_id
              ? allocation.crop_id.crop_name
              : order.crop_name,

          company_name:
            order.buyer_id
              ? order.buyer_id.company_name
              : null,

          delivery_address:
            order.delivery_address,

          bulk_order_quantity:
            order.quantity,

          bulk_order_total:
            order.total_amount,
        });
      }
    }

    // ==========================================
    // COMBINE BOTH TYPES
    // ==========================================
    const result = [
      ...normalResults,
      ...bulkResults,
    ].sort(
      (a, b) =>
        new Date(b.order_date) -
        new Date(a.order_date)
    );

    res.json(result);

  } catch (error) {
    console.error(
      "Get farmer orders error:",
      error
    );

    res.status(500).json({
      error: "Failed to fetch orders",
    });
  }
};