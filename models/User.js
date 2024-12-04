// models/User.js
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    location: String,
    bio: String,
    profileImage: String, // Stores the filename or path to the profile image
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
