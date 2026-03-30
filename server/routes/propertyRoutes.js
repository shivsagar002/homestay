const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const { 
  getProperties, 
  getPropertyById, 
  createProperty, 
  updateProperty, 
  deleteProperty,
  getPropertyAvailability 
} = require('../controllers/propertyController');

// Public routes
router.route('/')
  .get(getProperties);

router.route('/:id')
  .get(getPropertyById);

router.route('/:id/availability')
  .get(getPropertyAvailability);

// Protected routes (require authentication)
router.route('/')
  .post(protect, admin, createProperty);

router.route('/:id')
  .put(protect, updateProperty)
  .delete(protect, deleteProperty);

module.exports = router;