const { body, validationResult } = require("express-validator");

// ==========================================
// HANDLE VALIDATION ERRORS
// ==========================================

exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: errors.array()[0].msg,
    });
  }

  next();
};

// ==========================================
// SIGNUP VALIDATION
// ==========================================

exports.signupValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 100 })
    .withMessage("Name is too long"),

  body("email")
    .trim()
    .isEmail()
    .withMessage("Must be a valid email")
    .normalizeEmail(),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  body("role")
    .isIn(["farmer", "buyer"])
    .withMessage("Role must be 'farmer' or 'buyer'"),
];

// ==========================================
// LOGIN VALIDATION
// ==========================================

exports.loginValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Must be a valid email")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required"),
];

// ==========================================
// CROP VALIDATION
// ==========================================

exports.cropValidation = [
  body("crop_name")
    .trim()
    .notEmpty()
    .withMessage("Crop name is required")
    .isLength({ max: 100 })
    .withMessage("Crop name too long"),

  body("quantity")
    .isFloat({ min: 0.01 })
    .withMessage("Quantity must be a positive number"),

  body("price")
    .isFloat({ min: 0.01 })
    .withMessage("Price must be a positive number"),
];

// ==========================================
// ORDER VALIDATION
// ==========================================

exports.orderValidation = [
  // Crop ID
  body("crop_id")
    .isMongoId()
    .withMessage("Invalid crop_id"),

  // Quantity
  body("quantity")
    .isFloat({ min: 0.01 })
    .withMessage("Quantity must be a positive number"),

  // ========================================
  // DELIVERY ADDRESS
  // ========================================

  body("delivery_address")
    .notEmpty()
    .withMessage("Delivery address is required"),

  // Full name
  body("delivery_address.full_name")
    .trim()
    .notEmpty()
    .withMessage("Full name is required"),

  // Phone
  body("delivery_address.phone")
    .trim()
    .matches(/^\d{10}$/)
    .withMessage("Phone number must be exactly 10 digits"),

  // House / Flat / Building
  body("delivery_address.house")
    .trim()
    .notEmpty()
    .withMessage("House / Flat / Building is required"),

  // Area
  body("delivery_address.area")
    .trim()
    .notEmpty()
    .withMessage("Street / Area is required"),

  // City
  body("delivery_address.city")
    .trim()
    .notEmpty()
    .withMessage("City is required"),

  // District
  body("delivery_address.district")
    .trim()
    .notEmpty()
    .withMessage("District is required"),

  // State
  body("delivery_address.state")
    .trim()
    .notEmpty()
    .withMessage("State is required"),

  // Pincode
  body("delivery_address.pincode")
    .trim()
    .matches(/^\d{6}$/)
    .withMessage("Pincode must be exactly 6 digits"),

  // Landmark is optional
  body("delivery_address.landmark")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Landmark is too long"),
];

// ==========================================
// REVIEW VALIDATION
// ==========================================

exports.reviewValidation = [
  body("order_id")
    .isMongoId()
    .withMessage("Invalid order_id"),

  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),

  body("comment")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Comment too long"),
];