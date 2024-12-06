// utils/imageHelper.js
const cloudinary = require("cloudinary").v2;

const getOptimizedImageUrl = (url, options = {}) => {
  if (!url) return null;

  const defaults = {
    width: 800,
    quality: "auto",
    fetch_format: "auto",
  };

  const settings = { ...defaults, ...options };

  try {
    // Extract publicId including folder path
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)$/);
    if (!match) return url;

    const publicId = match[1].split(".")[0]; // Remove file extension if present

    return cloudinary.url(publicId, {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      secure: true,
      transformation: [settings],
    });
  } catch (error) {
    console.error("Error optimizing image:", error);
    return url;
  }
};

module.exports = { getOptimizedImageUrl };
