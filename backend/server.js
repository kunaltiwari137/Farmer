const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { authLimiter, generalLimiter } = require("./middleware/rateLimiter");

const app = express();

const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";
app.use(cors({
  origin: allowedOrigin,
  credentials: true,
}));

app.use(express.json());
app.use(generalLimiter);

app.get("/",(req,res) => {
    res.send("AgriConnect API is running")
})

const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authLimiter, authRoutes);

const cropRoutes = require("./routes/cropRoutes");
app.use("/api/crops", cropRoutes);

const buyerRoutes = require("./routes/buyerRoutes");
app.use("/api/buyers", buyerRoutes);

const orderRoutes = require("./routes/orderRoutes");
app.use("/api/orders", orderRoutes);

const paymentRoutes = require("./routes/paymentRoutes");
app.use("/api/payments", paymentRoutes);

const reviewRoutes = require("./routes/reviewRoutes");
app.use("/api/reviews", reviewRoutes);

const dashboardRoutes = require("./routes/dashboardRoutes");
app.use("/api/dashboard", dashboardRoutes);

const notificationRoutes = require("./routes/notificationRoutes");
app.use("/api/notifications", notificationRoutes);

const adminRoutes = require("./routes/adminRoutes");
app.use("/api/admin", adminRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT,() => {
    console.log(`Server running on http://localhost:${PORT}`);
});