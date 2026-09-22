const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const { signupValidation, loginValidation, handleValidationErrors } = require("../middleware/validators");

router.post("/signup", signupValidation, handleValidationErrors, authController.signup);
router.post("/login", loginValidation, handleValidationErrors, authController.login);
router.post("/verify-otp", authController.verifyOTP);
router.post("/google", authController.googleAuth);
router.put("/change-password", authMiddleware, authController.changePassword);

module.exports = router;