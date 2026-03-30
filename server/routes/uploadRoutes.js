const express = require('express');
const router = express.Router();
const { upload, uploadMultipleToCloudinary } = require('../middleware/upload');

// Upload single image
router.post('/single', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const result = await uploadMultipleToCloudinary([req.file]);
    res.json({
      message: 'Image uploaded successfully',
      image: result[0]
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Failed to upload image', error: error.message });
  }
});

// Upload multiple images (up to 5)
router.post('/multiple', upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No image files provided' });
    }

    const results = await uploadMultipleToCloudinary(req.files);
    res.json({
      message: 'Images uploaded successfully',
      images: results
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Failed to upload images', error: error.message });
  }
});

module.exports = router;
