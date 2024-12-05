// routes/auth.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { isAuthenticated } = require("../middleware/authMiddleware");

// Registration routes
router.get("/register", authController.registerForm);
router.post("/register", authController.registerUser);

// Login routes
router.get("/login", authController.loginForm);
router.post("/login", authController.loginUser);

// Logout route
router.get("/logout", authController.logoutUser);

// Profile edit route
router.get("/profile/edit", isAuthenticated, authController.editProfileForm);
router.post("/profile/edit", isAuthenticated, authController.updateProfile);

module.exports = router;
