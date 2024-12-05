// app.js
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const enforce = require("express-sslify");

// Initialize Express app
const app = express();

require("dotenv").config();

// Connect to MongoDB
if (process.env.NODE_ENV !== "test") {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log("Connected to MongoDB Atlas"))
    .catch((error) => console.error("MongoDB connection error:", error));
}

// Middleware
// 1. Basic middleware
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(express.static(path.join(__dirname, "public")));

// Set EJS as the templating engine
app.set("view engine", "ejs");

// 2. Security middleware
app.use(helmet());
app.use(cookieParser());

// 3. Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_session_secret",
    resave: true,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      ttl: 24 * 60 * 60,
      touchAfter: 24 * 3600, // Only update session once per day
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      httpOnly: true, // Mitigates XSS attacks
      secure: process.env.NODE_ENV === "production", // Ensures cookies are sent over HTTPS in production
      sameSite: "lax", // Controls cookie sending for CSRF protection
    },
    proxy: process.env.NODE_ENV === "production",
  })
);

app.use((req, res, next) => {
  console.log("Session:", req.session);
  console.log("User ID:", req.session.userId);
  res.locals.isAuthenticated = !!req.session.userId;
  next();
});

// Routes
const authRoutes = require("./routes/auth");
const seedRoutes = require("./routes/seeds");
const indexRoutes = require("./routes/index");

app.use("/", authRoutes);
app.use("/seeds", seedRoutes);
app.use("/", indexRoutes);

// Apply rate limiting to authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message:
    "Too many login attempts from this IP, please try again after 15 minutes.",
});

// Apply the rate limiter to login and registration routes
app.use("/login", authLimiter);
app.use("/register", authLimiter);

if (process.env.NODE_ENV === "production") {
  app.use(enforce.HTTPS({ trustProtoHeader: true }));
}

// Error-handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).render("error", {
    message:
      err.message || "An unexpected error occurred. Please try again later.",
    error: process.env.NODE_ENV === "production" ? {} : err,
    env: process.env.NODE_ENV || "development",
  });
});

// Home Route
app.get("/", (req, res) => {
  res.render("index");
});

// Start the server
if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
