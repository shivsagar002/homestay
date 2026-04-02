const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile, createAdmin, toggleWishlist, getWishlist } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.post('/wishlist/:id', protect, toggleWishlist);
router.get('/wishlist', protect, getWishlist);
router.post('/create-admin', createAdmin); // Hidden admin creation route

module.exports = router;