// controllers/authController.js
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/profiles/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Append the file extension
  },
});

const upload = multer({ storage: storage });

// Render registration form
exports.registerForm = (req, res) => {
  res.render("register");
};

// Handle user registration
exports.registerUser = [
  upload.single("profileImage"),
  async (req, res) => {
    console.log("RegisterUser function started");

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
      return res.render("register", { error: "Email already in use." });
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
  res.render("login");
};

// Handle user login
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    return res.render("login", { error: "Invalid email or password." });
  }

  // Compare passwords
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.render("login", { error: "Invalid email or password." });
  }

  // Successful login
  req.session.userId = user._id;
  res.redirect("/dashboard");
};

// Handle user logout
exports.logoutUser = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
};
