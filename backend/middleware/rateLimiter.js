const rateLimit = require("express-rate-limit");

// STEP 1: A stricter limiter specifically for auth routes (login/signup) — these are prime brute-force targets
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // allow only 10 requests per IP in that window
  message: { error: "Too many attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// STEP 2: A more generous limiter for general API use
exports.generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200, // 200 requests per 15 minutes is plenty for normal browsing
  message: { error: "Too many requests, please slow down" },
  standardHeaders: true,
  legacyHeaders: false,
});