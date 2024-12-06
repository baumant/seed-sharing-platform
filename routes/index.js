// routes/index.js
const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../middleware/authMiddleware");
const User = require("../models/User");
const { getOptimizedImageUrl } = require("../utils/imageHelper"); // Add import

// Dashboard route
router.get("/dashboard", isAuthenticated, async (req, res) => {
  const user = await User.findById(req.session.userId);
  res.render("dashboard", { user, getOptimizedImageUrl });
});

module.exports = router;
