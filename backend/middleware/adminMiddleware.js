// STEP 1: This middleware runs AFTER authMiddleware, so req.user already exists and is verified
const adminMiddleware = (req, res, next) => {
  // STEP 2: Check the role embedded in the already-verified JWT
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  // STEP 3: If they are an admin, let the request continue
  next();
};

module.exports = adminMiddleware;