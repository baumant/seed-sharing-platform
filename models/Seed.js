// models/Seed.js
const mongoose = require("mongoose");

const SeedSchema = new mongoose.Schema(
  {
    plantType: {
      type: String,
      required: true,
      trim: true,
    },
    varietyName: {
      type: String,
      required: true,
      trim: true,
    },
    varietyDescription: {
      type: String,
      trim: true,
    },
    image: String, // Stores the filename or path to the image
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Seed", SeedSchema);
