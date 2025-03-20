const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticate } = require('../middleware/auth');
const User = require('../models/User');
const Folder = require('../models/Folder');
const logger = require('../utils/logger');

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this email or username already exists' 
      });
    }
    
    // Create new user
    const user = new User({
      username,
      email,
      passwordHash: password, // Will be hashed by the pre-save hook
    });
    
    await user.save();
    
    // Create default folder for the user
    const defaultFolder = new Folder({
      userId: user._id,
      name: 'My Images',
      description: 'Default folder for your images',
      isDefault: true
    });
    
    await defaultFolder.save();
    
    // Generate token
    const token = user.generateAuthToken();
    
    // Set token in cookie
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    // Return user info
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user and return JWT token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Update last login
    user.lastLogin = Date.now();
    await user.save();
    
    // Generate token
    const token = user.generateAuthToken();
    
    // Set token in cookie
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    // Return user info
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ user });
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logout successful' });
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { username, bio, profileGif } = req.body;
    
    // Check if username is already taken
    if (username && username !== req.user.username) {
      const formattedUsername = username.startsWith('@') ? username : `@${username}`;
      const existingUser = await User.findOne({ username: formattedUsername });
      
      if (existingUser && existingUser._id.toString() !== req.user.id) {
        return res.status(400).json({ message: 'Username is already taken' });
      }
    }
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { 
        $set: { 
          username: username || req.user.username,
          bio: bio !== undefined ? bio : req.user.bio,
          profileGif: profileGif || req.user.profileGif
        } 
      },
      { new: true, runValidators: true }
    ).select('-passwordHash');
    
    res.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error during profile update' });
  }
});

// @route   PUT /api/auth/password
// @desc    Change password
// @access  Private
router.put('/password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Get user with password
    const user = await User.findById(req.user.id);
    
    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Update password
    user.passwordHash = newPassword;
    await user.save();
    
    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Server error during password change' });
  }
});

module.exports = router; 