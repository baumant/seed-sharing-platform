// app.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const path = require("path");

// Initialize Express app
const app = express();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((error) => console.error("MongoDB connection error:", error));

// Middleware
app.use(express.json());
//app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

//// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "ssp_session_secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
    }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 1 day
  })
);

//// isAuthenticated middleware
app.use((req, res, next) => {
  res.locals.isAuthenticated = !!req.session.userId;
  next();
});

// Set EJS as the templating engine
app.set("view engine", "ejs");

// Routes
const authRoutes = require("./routes/auth");
app.use("/", authRoutes);

const indexRoutes = require("./routes/index");
app.use("/", indexRoutes);

const seedRoutes = require("./routes/seeds");
app.use("/seeds", seedRoutes);

// Home Route
app.get("/", (req, res) => {
  res.render("index");
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
