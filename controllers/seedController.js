// controllers/seedController.js
const Seed = require("../models/Seed");
const multer = require("multer");
const path = require("path");
const { body, validationResult } = require("express-validator");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { getOptimizedImageUrl } = require("../utils/imageHelper");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "seeds",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

// Configure Multer for file uploads
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "public/uploads/seeds/");
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + path.extname(file.originalname)); // Append the file extension
//   },
// });

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.mimetype.startsWith("image/")) {
    req.fileValidationError = "Only image files are allowed!";
    cb(new Error("Only image files are allowed!"), false);
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 }, // Limit files to 5MB
});

// Render form to create a new seed listing
exports.newSeedForm = (req, res) => {
  res.render("seeds/new");
};

// Handle creation of a new seed listing
exports.createSeed = [
  upload.single("image"),

  body("plantType").trim().notEmpty().withMessage("Plant type is required"),
  body("varietyName").trim().notEmpty().withMessage("Variety name is required"),
  body("varietyDescription").trim(),

  async (req, res) => {
    const { plantType, varietyName, varietyDescription } = req.body;
    const image = req.file ? req.file.path : null;

    const seed = new Seed({
      plantType,
      varietyName,
      varietyDescription,
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
  res.render("seeds/mine", { seeds, getOptimizedImageUrl });
};

// Display all seed listings
exports.allSeeds = async (req, res) => {
  try {
    const seeds = await Seed.find().populate(
      "owner",
      "username location email"
    );
    res.render("seeds/index", {
      seeds,
      query: "",
      getOptimizedImageUrl,
    });
  } catch (error) {
    console.error("Error fetching seeds:", error);
    res.status(500).render("error", {
      message: "An error occurred while fetching seeds.",
      error,
      env: process.env.NODE_ENV || "development",
    });
  }
};

// Render form to edit a seed listing
exports.editSeedForm = async (req, res) => {
  try {
    const seed = await Seed.findById(req.params.id);
    if (!seed || seed.owner.toString() !== req.session.userId) {
      return res.redirect("/seeds/mine");
    }

    res.render("seeds/edit", {
      seed,
      getOptimizedImageUrl,
    });
  } catch (error) {
    console.error("Error rendering edit form:", error);
    res.status(500).render("error", {
      message: "An error occurred while loading the edit form.",
      error,
      env: process.env.NODE_ENV || "development",
    });
  }
};

// Handle updating a seed listing
exports.updateSeed = [
  upload.single("image"),

  body("plantType").trim().notEmpty(),
  body("varietyName").trim().notEmpty(),
  body("varietyDescription").trim(),

  async (req, res) => {
    const { plantType, varietyName, varietyDescription } = req.body;
    const image = req.file ? req.file.path : null;

    try {
      const seed = await Seed.findById(req.params.id);
      if (!seed || seed.owner.toString() !== req.session.userId) {
        return res.redirect("/seeds/mine");
      }

      seed.plantType = plantType;
      seed.varietyName = varietyName;
      seed.varietyDescription = varietyDescription;
      if (image) seed.image = image;

      await seed.save();
      res.redirect("/seeds/mine");
    } catch (error) {
      console.error(error);
      res.render("seeds/edit", {
        error: "Error updating seed listing.",
        seed: req.body,
        getOptimizedImageUrl,
      });
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
      { plantType: new RegExp(query, "i") },
      { varietyName: new RegExp(query, "i") },
    ],
  }).populate("owner", "username location email");
  res.render("seeds/index", { seeds, query, getOptimizedImageUrl });
};
