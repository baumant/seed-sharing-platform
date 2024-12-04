// models/Seed.js
const mongoose = require("mongoose");

const SeedSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    quantity: { type: String },
    seedType: { type: String },
    image: String, // Stores the filename or path to the image
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Seed", SeedSchema);
