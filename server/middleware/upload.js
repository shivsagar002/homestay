const multer = require('multer');
const { cloudinary, configureCloudinary } = require('../config/cloudinary');

// Use memory storage for multer (files stored in buffer)
const storage = multer.memoryStorage();

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Upload single image to Cloudinary
const uploadToCloudinary = async (file) => {
  configureCloudinary(); // Ensure cloudinary is configured
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'homestay/properties',
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 800, crop: 'limit' },
          { quality: 'auto:good' }
        ]
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            url: result.secure_url,
            public_id: result.public_id
          });
        }
      }
    );
    
    // Create buffer stream and pipe to upload stream
    const { Readable } = require('stream');
    const stream = Readable.from(file.buffer);
    stream.pipe(uploadStream);
  });
};

// Upload multiple images to Cloudinary
const uploadMultipleToCloudinary = async (files) => {
  const uploadPromises = files.map(file => uploadToCloudinary(file));
  return Promise.all(uploadPromises);
};

// Delete image from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  configureCloudinary(); // Ensure cloudinary is configured
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    return false;
  }
};

module.exports = {
  upload,
  uploadToCloudinary,
  uploadMultipleToCloudinary,
  deleteFromCloudinary
};
