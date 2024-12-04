// routes/seeds.js
const express = require("express");
const router = express.Router();
const seedController = require("../controllers/seedController");
const { isAuthenticated } = require("../middleware/authMiddleware");

// New seed listing
router.get("/new", isAuthenticated, seedController.newSeedForm);
router.post("/new", isAuthenticated, seedController.createSeed);

// My seed listings
router.get("/mine", isAuthenticated, seedController.mySeeds);

// Edit seed listing
router.get("/edit/:id", isAuthenticated, seedController.editSeedForm);
router.post("/edit/:id", isAuthenticated, seedController.updateSeed);

// Delete seed listing
router.post("/delete/:id", isAuthenticated, seedController.deleteSeed);

// All seed listings
router.get("/", seedController.allSeeds);

// Search seed listings
router.get("/search", seedController.searchSeeds);

module.exports = router;
