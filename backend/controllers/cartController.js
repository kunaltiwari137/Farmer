const Cart = require("../models/Cart");
const Crop = require("../models/Crop");
const Buyer = require("../models/Buyer");
const Order = require("../models/Order");
const Farmer = require("../models/Farmer");
const { createNotification } = require("./notificationController");

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
// GET CART
// ==========================================
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({
      user_id: req.user.user_id,
    }).populate("items.crop_id");

    if (!cart) {
      cart = await Cart.create({
        user_id: req.user.user_id,
        items: [],
      });
    }

    res.json(cart);
  } catch (error) {
    console.error("Get cart error:", error);

    res.status(500).json({
      error: "Failed to fetch cart",
    });
  }
};

// ==========================================
// ADD TO CART
// ==========================================
exports.addToCart = async (req, res) => {
  try {
    const { crop_id, quantity } = req.body;

    if (!crop_id || !quantity) {
      return res.status(400).json({
        error: "crop_id and quantity are required",
      });
    }

    const cartQuantity = Number(quantity);

    if (!Number.isFinite(cartQuantity) || cartQuantity <= 0) {
      return res.status(400).json({
        error: "Quantity must be greater than 0",
      });
    }

    const crop = await Crop.findById(crop_id);

    if (!crop) {
      return res.status(404).json({
        error: "Crop not found",
      });
    }

    if (crop.status !== "available") {
      return res.status(400).json({
        error: "This crop is no longer available",
      });
    }

    if (cartQuantity > crop.quantity) {
      return res.status(400).json({
        error: `Only ${crop.quantity} kg available`,
      });
    }

    let cart = await Cart.findOne({
      user_id: req.user.user_id,
    });

    if (!cart) {
      cart = await Cart.create({
        user_id: req.user.user_id,
        items: [],
      });
    }

    const existingItem = cart.items.find(
      (item) =>
        item.crop_id.toString() === crop_id.toString()
    );

    if (existingItem) {
      const newQuantity =
        existingItem.quantity + cartQuantity;

      if (newQuantity > crop.quantity) {
        return res.status(400).json({
          error: `Only ${crop.quantity} kg available`,
        });
      }

      existingItem.quantity = newQuantity;
    } else {
      cart.items.push({
        crop_id,
        quantity: cartQuantity,
      });
    }

    await cart.save();

    res.json({
      message: "Added to cart",
    });
  } catch (error) {
    console.error("Add to cart error:", error);

    res.status(500).json({
      error: "Failed to add to cart",
    });
  }
};

// ==========================================
// UPDATE CART QUANTITY
// ==========================================
exports.updateCartQuantity = async (req, res) => {
  try {
    const { crop_id } = req.params;
    const { quantity } = req.body;

    const newQuantity = Number(quantity);

    if (!Number.isFinite(newQuantity)) {
      return res.status(400).json({
        error: "Invalid quantity",
      });
    }

    const cart = await Cart.findOne({
      user_id: req.user.user_id,
    });

    if (!cart) {
      return res.status(404).json({
        error: "Cart not found",
      });
    }

    const item = cart.items.find(
      (cartItem) =>
        cartItem.crop_id.toString() === crop_id.toString()
    );

    if (!item) {
      return res.status(404).json({
        error: "Item not found in cart",
      });
    }

    // ========================================
    // IF QUANTITY IS 0 OR LESS
    // REMOVE ITEM
    // ========================================
    if (newQuantity <= 0) {
      cart.items = cart.items.filter(
        (cartItem) =>
          cartItem.crop_id.toString() !== crop_id.toString()
      );

      await cart.save();

      return res.json({
        message: "Item removed from cart",
      });
    }

    // ========================================
    // CHECK CROP STOCK
    // ========================================
    const crop = await Crop.findById(crop_id);

    if (!crop) {
      return res.status(404).json({
        error: "Crop not found",
      });
    }

    if (crop.status !== "available") {
      return res.status(400).json({
        error: "This crop is no longer available",
      });
    }

    if (newQuantity > crop.quantity) {
      return res.status(400).json({
        error: `Only ${crop.quantity} kg available`,
      });
    }

    // ========================================
    // UPDATE QUANTITY
    // ========================================
    item.quantity = newQuantity;

    await cart.save();

    res.json({
      message: "Cart quantity updated",
      quantity: newQuantity,
    });
  } catch (error) {
    console.error(
      "Update cart quantity error:",
      error
    );

    res.status(500).json({
      error: "Failed to update cart quantity",
    });
  }
};

// ==========================================
// REMOVE FROM CART
// ==========================================
exports.removeFromCart = async (req, res) => {
  try {
    const { crop_id } = req.params;

    const cart = await Cart.findOne({
      user_id: req.user.user_id,
    });

    if (!cart) {
      return res.status(404).json({
        error: "Cart not found",
      });
    }

    cart.items = cart.items.filter(
      (item) =>
        item.crop_id.toString() !== crop_id.toString()
    );

    await cart.save();

    res.json({
      message: "Removed from cart",
    });
  } catch (error) {
    console.error(
      "Remove from cart error:",
      error
    );

    res.status(500).json({
      error: "Failed to remove item",
    });
  }
};

// ==========================================
// CHECKOUT CART
// ==========================================
exports.checkoutCart = async (req, res) => {
  try {
    const { delivery_address } = req.body;

    // ========================================
    // VALIDATE ADDRESS
    // ========================================
    const addressError =
      validateAddress(delivery_address);

    if (addressError) {
      return res.status(400).json({
        error: addressError,
      });
    }

    // ========================================
    // FIND BUYER
    // ========================================
    const buyer = await Buyer.findOne({
      user_id: req.user.user_id,
    });

    if (!buyer) {
      return res.status(403).json({
        error: "Only registered buyers can checkout",
      });
    }

    // ========================================
    // GET CART
    // ========================================
    const cart = await Cart.findOne({
      user_id: req.user.user_id,
    }).populate("items.crop_id");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        error: "Your cart is empty",
      });
    }

    // ========================================
    // VALIDATE ALL ITEMS
    // ========================================
    for (const item of cart.items) {
      const crop = item.crop_id;

      if (!crop) {
        return res.status(400).json({
          error:
            "One of the crops in your cart no longer exists",
        });
      }

      if (crop.status !== "available") {
        return res.status(400).json({
          error: `${crop.crop_name} is no longer available`,
        });
      }

      if (item.quantity <= 0) {
        return res.status(400).json({
          error: `Invalid quantity for ${crop.crop_name}`,
        });
      }

      if (item.quantity > crop.quantity) {
        return res.status(400).json({
          error: `Only ${crop.quantity} kg of ${crop.crop_name} is available`,
        });
      }
    }

    // ========================================
    // CREATE ORDERS
    // ========================================
    const createdOrders = [];

    for (const item of cart.items) {
      const crop = item.crop_id;

      const total_amount =
        item.quantity * crop.price;

      const order = await Order.create({
        crop_id: crop._id,
        buyer_id: buyer._id,
        quantity: item.quantity,
        total_amount,

        delivery_address: {
          full_name:
            delivery_address.full_name.trim(),

          phone:
            String(delivery_address.phone).trim(),

          house:
            delivery_address.house.trim(),

          area:
            delivery_address.area.trim(),

          city:
            delivery_address.city.trim(),

          district:
            delivery_address.district.trim(),

          state:
            delivery_address.state.trim(),

          pincode:
            String(delivery_address.pincode).trim(),

          landmark:
            delivery_address.landmark
              ? delivery_address.landmark.trim()
              : "",
        },

        status: "pending",
      });

      createdOrders.push(order._id);

      // ========================================
      // REDUCE STOCK
      // ========================================
      crop.quantity =
        crop.quantity - item.quantity;

      crop.status =
        crop.quantity <= 0
          ? "sold_out"
          : "available";

      await crop.save();

      // ========================================
      // FARMER NOTIFICATION
      // ========================================
      const farmer = await Farmer.findById(
        crop.farmer_id
      );

      if (farmer) {
        await createNotification(
          farmer.user_id,
          `New order: ${item.quantity}kg of your ${crop.crop_name} was ordered!`,
          "order",
          req.user.user_id
        );

        // LOW STOCK
        if (
          crop.quantity > 0 &&
          crop.quantity <= 10
        ) {
          await createNotification(
            farmer.user_id,
            `Low stock alert: only ${crop.quantity}kg of ${crop.crop_name} left!`,
            "stock"
          );
        }
      }
    }

    // ========================================
    // CLEAR CART
    // ========================================
    cart.items = [];

    await cart.save();

    // ========================================
    // RESPONSE
    // ========================================
    res.status(201).json({
      message: "Checkout successful",
      order_ids: createdOrders,
    });
  } catch (error) {
    console.error(
      "Checkout cart error:",
      error
    );

    res.status(500).json({
      error: "Checkout failed",
    });
  }
};