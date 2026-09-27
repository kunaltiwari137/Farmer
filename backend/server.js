const express = require("express");
const http = require("http");
const cors = require("cors");
require("dotenv").config();

const {
  authLimiter,
  generalLimiter,
} = require("./middleware/rateLimiter");

const connectDB = require("./config/mongodb");
const { initSocket } = require("./config/socket");


// ==========================================
// EXPRESS APP
// ==========================================
const app = express();


// ==========================================
// CORS
// ==========================================
const allowedOrigin =
  process.env.FRONTEND_URL ||
  "http://localhost:5173";

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);


// ==========================================
// JSON BODY PARSER
// ==========================================
app.use(express.json());


// ==========================================
// GENERAL RATE LIMITER
// ==========================================
app.use(generalLimiter);


// ==========================================
// ROOT
// ==========================================
app.get("/", (req, res) => {
  res.send("AgriConnect API is running");
});


// ==========================================
// AUTH ROUTES
// ==========================================
const authRoutes = require("./routes/authRoutes");

app.use(
  "/api/auth",
  authLimiter,
  authRoutes
);


// ==========================================
// CROP ROUTES
// ==========================================
const cropRoutes = require("./routes/cropRoutes");

app.use(
  "/api/crops",
  cropRoutes
);


// ==========================================
// BUYER ROUTES
// ==========================================
const buyerRoutes = require("./routes/buyerRoutes");

app.use(
  "/api/buyers",
  buyerRoutes
);


// ==========================================
// ORDER ROUTES
// ==========================================
const orderRoutes = require("./routes/orderRoutes");

app.use(
  "/api/orders",
  orderRoutes
);


// ==========================================
// PAYMENT ROUTES
// ==========================================
const paymentRoutes = require("./routes/paymentRoutes");

app.use(
  "/api/payments",
  paymentRoutes
);


// ==========================================
// REVIEW ROUTES
// ==========================================
const reviewRoutes = require("./routes/reviewRoutes");

app.use(
  "/api/reviews",
  reviewRoutes
);


// ==========================================
// DASHBOARD ROUTES
// ==========================================
const dashboardRoutes = require("./routes/dashboardRoutes");

app.use(
  "/api/dashboard",
  dashboardRoutes
);


// ==========================================
// NOTIFICATION ROUTES
// ==========================================
const notificationRoutes =
  require("./routes/notificationRoutes");

app.use(
  "/api/notifications",
  notificationRoutes
);


// ==========================================
// ADMIN ROUTES
// ==========================================
const adminRoutes =
  require("./routes/adminRoutes");

app.use(
  "/api/admin",
  adminRoutes
);


// ==========================================
// WISHLIST ROUTES
// ==========================================
const wishlistRoutes =
  require("./routes/wishlistRoutes");

app.use(
  "/api/wishlist",
  wishlistRoutes
);


// ==========================================
// FARMER ROUTES
// ==========================================
const farmerRoutes =
  require("./routes/farmerRoutes");

app.use(
  "/api/farmers",
  farmerRoutes
);


// ==========================================
// CART ROUTES
// ==========================================
app.use(
  "/api/cart",
  require("./routes/cartRoutes")
);


// ==========================================
// CHAT ROUTES
// ==========================================
app.use(
  "/api/chat",
  require("./routes/chatRoutes")
);


// ==========================================
// MANDI ROUTES
// ==========================================
app.use(
  "/api/mandi",
  require("./routes/mandiRoutes")
);


// ==========================================
// BULK ORDER REQUEST ROUTES
// ==========================================
const bulkOrderRequestRoutes =
  require("./routes/bulkOrderRequestRoutes");

app.use(
  "/api/bulk-requests",
  bulkOrderRequestRoutes
);


// ==========================================
// 🌱 PLANT DISEASE DETECTION ROUTES
// ==========================================
const diseaseRoutes =
  require("./routes/diseaseRoutes");

app.use(
  "/api/disease",
  diseaseRoutes
);


// ==========================================
// START SERVER
// ==========================================
const startServer = async () => {
  try {

    // Connect MongoDB
    await connectDB();

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize Socket.IO
    initSocket(server);

    // Port
    const PORT =
      process.env.PORT || 5000;

    // Start server
    server.listen(PORT, () => {
      console.log(
        `Server running on http://localhost:${PORT}`
      );
    });

  } catch (error) {

    console.error(
      "Failed to start server:",
      error.message
    );

    process.exit(1);
  }
};


// ==========================================
// START ONLY WHEN THIS FILE IS RUN DIRECTLY
// ==========================================
if (require.main === module) {
  startServer();
}


// ==========================================
// EXPORT APP FOR TESTING
// ==========================================
module.exports = app;