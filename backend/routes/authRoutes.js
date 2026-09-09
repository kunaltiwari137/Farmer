const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { signupValidation, loginValidation, handleValidationErrors } = require("../middleware/validators");

router.post("/signup", signupValidation, handleValidationErrors, authController.signup);
router.post("/login", loginValidation, handleValidationErrors, authController.login);

module.exports = router;