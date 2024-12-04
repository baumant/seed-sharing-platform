// controllers/seedController.js
const Seed = require("../models/Seed");
const multer = require("multer");
const path = require("path");

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/seeds/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Append the file extension
  },
});

const upload = multer({ storage: storage });

// Render form to create a new seed listing
exports.newSeedForm = (req, res) => {
  res.render("seeds/new");
};

// Handle creation of a new seed listing
exports.createSeed = [
  upload.single("image"),
  async (req, res) => {
    const { title, description, quantity, seedType } = req.body;
    const image = req.file ? "/uploads/seeds/" + req.file.filename : null;

    const seed = new Seed({
      title,
      description,
      quantity,
      seedType,
      image,
      owner: req.session.userId,
    });

    try {
      await seed.save();
      res.redirect("/seeds/mine");
    } catch (error) {
      console.error(error);
      res.render("seeds/new", { error: "Error creating seed listing." });
    }
  },
];

// Display user's seed listings
exports.mySeeds = async (req, res) => {
  const seeds = await Seed.find({ owner: req.session.userId });
  res.render("seeds/mine", { seeds });
};

// Display all seed listings
exports.allSeeds = async (req, res) => {
  const seeds = await Seed.find().populate("owner", "username location");
  const query = ""; // Ensure query is defined
  res.render("seeds/index", { seeds, query });
};

// Render form to edit a seed listing
exports.editSeedForm = async (req, res) => {
  const seed = await Seed.findById(req.params.id);
  if (!seed || seed.owner.toString() !== req.session.userId) {
    return res.redirect("/seeds/mine");
  }
  res.render("seeds/edit", { seed });
};

// Handle updating a seed listing
exports.updateSeed = [
  upload.single("image"),
  async (req, res) => {
    const { title, description, quantity, seedType } = req.body;
    const image = req.file ? "/uploads/seeds/" + req.file.filename : null;

    try {
      const seed = await Seed.findById(req.params.id);
      if (!seed || seed.owner.toString() !== req.session.userId) {
        return res.redirect("/seeds/mine");
      }

      seed.title = title;
      seed.description = description;
      seed.quantity = quantity;
      seed.seedType = seedType;
      if (image) seed.image = image;

      await seed.save();
      res.redirect("/seeds/mine");
    } catch (error) {
      console.error(error);
      res.render("seeds/edit", { error: "Error updating seed listing.", seed });
    }
  },
];

// Handle deleting a seed listing
exports.deleteSeed = async (req, res) => {
  try {
    const seed = await Seed.findOneAndDelete({
      _id: req.params.id,
      owner: req.session.userId,
    });

    if (!seed) {
      return res.status(404).render("error", {
        message:
          "Seed listing not found or you are not authorized to delete it.",
      });
    }

    res.redirect("/seeds/mine");
  } catch (error) {
    console.error(error);
    res.status(500).render("error", {
      message: "An error occurred while deleting the seed listing.",
    });
  }
};

// Search seeds by name or type
exports.searchSeeds = async (req, res) => {
  const query = req.query.q || "";
  const seeds = await Seed.find({
    $or: [
      { title: new RegExp(query, "i") },
      { seedType: new RegExp(query, "i") },
    ],
  }).populate("owner", "username location");
  res.render("seeds/index", { seeds, query });
};
