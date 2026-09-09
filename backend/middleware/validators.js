const { body, validationResult } = require("express-validator");

// STEP 1: A reusable middleware that checks if any validation errors occurred,
// and if so, stops the request with a clean error response
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

// STEP 2: Validation rules for signup
exports.signupValidation = [
  body("name").trim().notEmpty().withMessage("Name is required")
    .isLength({ max: 100 }).withMessage("Name is too long"),
  body("email").trim().isEmail().withMessage("Must be a valid email").normalizeEmail(),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("role").isIn(["farmer", "buyer"]).withMessage("Role must be 'farmer' or 'buyer'"),
];

// STEP 3: Validation rules for login
exports.loginValidation = [
  body("email").trim().isEmail().withMessage("Must be a valid email").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

// STEP 4: Validation rules for creating a crop
exports.cropValidation = [
  body("crop_name").trim().notEmpty().withMessage("Crop name is required")
    .isLength({ max: 100 }).withMessage("Crop name too long"),
  body("quantity").isFloat({ min: 0.01 }).withMessage("Quantity must be a positive number"),
  body("price").isFloat({ min: 0.01 }).withMessage("Price must be a positive number"),
];

// STEP 5: Validation rules for placing an order
exports.orderValidation = [
  body("crop_id").isInt({ min: 1 }).withMessage("Invalid crop_id"),
  body("quantity").isFloat({ min: 0.01 }).withMessage("Quantity must be a positive number"),
];

// STEP 6: Validation rules for a review
exports.reviewValidation = [
  body("order_id").isInt({ min: 1 }).withMessage("Invalid order_id"),
  body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
  body("comment").optional().trim().isLength({ max: 500 }).withMessage("Comment too long"),
];