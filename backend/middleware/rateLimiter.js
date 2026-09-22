
const rateLimit = require("express-rate-limit");

// ==========================================
// AUTH RATE LIMITER
// ==========================================
// Protects login/signup from brute-force attacks.
//
// Development:
// 100 attempts per 15 minutes.
//
// We keep a limit here for security, but make it
// generous enough for local development/testing.

exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: 100,

  message: {
    error: "Too many login attempts. Please try again later.",
  },

  standardHeaders: true,
  legacyHeaders: false,
});

// ==========================================
// GENERAL API RATE LIMITER
// ==========================================
// Your React frontend makes many API requests
// while navigating and refreshing dashboards.
//
// 2000 requests per 15 minutes is suitable for
// local development.

exports.generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: 2000,

  message: {
    error: "Too many requests, please slow down.",
  },

  standardHeaders: true,
  legacyHeaders: false,
});
