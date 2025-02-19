// controllers/authController.js
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const { body, validationResult } = require("express-validator");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { getOptimizedImageUrl } = require("../utils/imageHelper");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "profiles", // Separate folder for profile images
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
  },
});

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    req.fileValidationError = "Only image files are allowed!";
    cb(null, false);
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 }, // Limit files to 5MB
});

// Render registration form
exports.registerForm = (req, res) => {
  res.render("register", { errors: [] });
};

// Handle user registration
exports.registerUser = [
  // File upload middleware
  upload.single("profileImage"),

  // Validation middleware
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required.")
    .isLength({ min: 3 })
    .withMessage("Username must be at least 3 characters long."),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Invalid email address."),
  body("password")
    .notEmpty()
    .withMessage("Password is required.")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long."),
  body("location").trim().escape(),
  body("bio").trim().escape(),
  body("email").normalizeEmail(),

  async (req, res) => {
    // Check for upload errors
    if (req.fileValidationError) {
      return res.render("register", { error: req.fileValidationError });
    }

    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render("register", { errors: errors.array() });
    }

    const { username, email, password, location, bio } = req.body;

    const profileImage = req.file ? req.file.path : null;

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.render("register", {
        errors: [{ msg: "Email already in use" }],
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      location,
      bio,
      profileImage,
    });
    console.log("User object created:", user);

    try {
      console.log("Saving user to database");
      await user.save();
      console.log("User saved successfully");

      req.session.userId = user._id; // Log the user in
      console.log("User session created:", req.session.userId);

      res.redirect("/dashboard");
    } catch (error) {
      console.error("Error saving user:", error);
      res.render("register", { error: "Error registering user." });
    }
  },
];

// Render login form
exports.loginForm = (req, res) => {
  res.render("login", {
    errors: [],
  });
};

// Handle user login
exports.loginUser = [
  // Validation middleware...
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Invalid email address."),
  body("password").notEmpty().withMessage("Password is required."),
  body("email").normalizeEmail(),

  async (req, res) => {
    // Handle validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render("login", { errors: errors.array() });
    }

    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });

      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.render("login", {
          errors: [{ msg: "Invalid email or password" }],
        });
      }

      // Set session and wait for it to save
      req.session.userId = user._id;
      await new Promise((resolve) => req.session.save(resolve));

      res.redirect("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      res.render("login", {
        errors: [{ msg: "An error occurred during login" }],
      });
    }
  },
];

// Handle user logout
exports.logoutUser = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
};

exports.editProfileForm = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    res.render("profile/edit", { user, error: null, getOptimizedImageUrl });
  } catch (error) {
    console.error("Error loading profile:", error);
    res.status(500).render("error", {
      message: "Error loading profile",
      error,
      env: process.env.NODE_ENV || "development",
    });
  }
};

exports.updateProfile = [
  upload.single("profileImage"),

  // Validation
  body("username").trim().notEmpty().withMessage("Username is required"),
  body("email").trim().isEmail().withMessage("Valid email is required"),
  body("location").trim().escape(),
  body("bio").trim().escape(),

  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.render("profile/edit", {
          user: req.body,
          errors: errors.array(),
          getOptimizedImageUrl,
        });
      }

      const updateData = {
        ...req.body,
        profileImage: req.file ? req.file.path : undefined,
      };

      const user = await User.findByIdAndUpdate(
        req.session.userId,
        updateData,
        { new: true }
      );

      res.redirect("/dashboard");
    } catch (error) {
      console.error("Error updating profile:", error);
      res.render("profile/edit", {
        user: req.body,
        error: "Error updating profile",
        getOptimizedImageUrl,
      });
    }
  },
];
