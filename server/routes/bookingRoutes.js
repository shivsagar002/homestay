const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const { 
  createBooking, 
  getUserBookings, 
  getAllBookings, 
  updateBookingStatus, 
  cancelBooking,
  updateBooking,
  updatePaymentStatus
} = require('../controllers/bookingController');

// All routes require authentication
router.route('/')
  .post(protect, createBooking)
  .get(protect, admin, getAllBookings);

router.get('/my-bookings', protect, getUserBookings);
router.put('/:id/status', protect, admin, updateBookingStatus);
router.put('/:id/cancel', protect, cancelBooking);
router.put('/:id/payment', protect, admin, updatePaymentStatus);
router.put('/:id', protect, updateBooking);

module.exports = router;