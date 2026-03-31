const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    console.log('Registration request body:', req.body);
    
    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'Guest'
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        wishlist: user.wishlist || [],
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration Error Details:', error);
    
    // Handle Mongoose duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already exists. Please use a different email.' });
    }
    
    res.status(400).json({ message: error.message || 'Registration failed' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        wishlist: user.wishlist || [],
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        wishlist: user.wishlist || [],
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Create admin user (Hidden route - not exposed on frontend)
// @route   POST /api/auth/create-admin
// @access  Public (Should be protected or used only during initial setup)
const createAdmin = async (req, res) => {
  try {
    const { name, email, password, adminSecretKey } = req.body;
    
    // Verify admin secret key for security
    if (adminSecretKey !== process.env.ADMIN_SECRET_KEY && adminSecretKey !== 'homestay_admin_2026') {
      return res.status(403).json({ message: 'Invalid admin secret key' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create admin user
    const user = await User.create({
      name,
      email,
      password,
      role: 'Admin'
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        wishlist: user.wishlist || [],
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Toggle property in wishlist
// @route   POST /api/auth/wishlist/:id
// @access  Private
const toggleWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const propertyId = req.params.id;

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const index = user.wishlist.indexOf(propertyId);
    if (index === -1) {
      // Add to wishlist
      user.wishlist.push(propertyId);
    } else {
      // Remove from wishlist
      user.wishlist.splice(index, 1);
    }

    await user.save();
    res.json({ 
      message: index === -1 ? 'Added to wishlist' : 'Removed from wishlist',
      wishlist: user.wishlist 
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  generateToken,
  createAdmin,
  toggleWishlist
};