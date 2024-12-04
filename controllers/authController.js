// controllers/authController.js
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");
const { body, validationResult } = require("express-validator");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/profiles/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Append the file extension
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
    console.log("Form data:", req.body);

    const profileImage = req.file
      ? "/uploads/profiles/" + req.file.filename
      : null;
    console.log("Profile Image:", profileImage);

    // Check if user already exists
    console.log("Checking if user exists");
    const existingUser = await User.findOne({ email });
    console.log("Existing user:", existingUser);

    if (existingUser) {
      console.log("User already exists");
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

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.render("login", {
        errors: [{ msg: "Invalid email or password." }],
      });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render("login", {
        errors: [{ msg: "Invalid email or password." }],
      });
    }

    // Successful login
    req.session.regenerate((err) => {
      if (err) {
        console.error("Session regeneration error:", err);
        return res.render("login", {
          errors: [
            { msg: "An error occurred during login. Please try again." },
          ],
        });
      }

      req.session.userId = user._id;
      res.redirect("/dashboard");
    });
  },
];

// Handle user logout
exports.logoutUser = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
};
