const cloudinary = require('cloudinary').v2;

// Lazy configuration - configures at runtime when first used
let isConfigured = false;

const configureCloudinary = () => {
  if (!isConfigured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
    isConfigured = true;
  }
  return cloudinary;
};

module.exports = { cloudinary, configureCloudinary };
