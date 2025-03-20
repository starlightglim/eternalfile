const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const User = require('../models/User');
const mongoose = require('mongoose');

// Middleware to check if the user is authenticated
const authenticate = async (req, res, next) => {
  // For development, allow bypassing authentication
  if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
    try {
      // Try to get the demo user from the database
      const demoUser = await User.findOne({ email: 'demo@example.com' });
      if (demoUser) {
        req.user = { id: demoUser._id, username: demoUser.username, role: demoUser.role };
        logger.debug(`Using demo user: ${demoUser._id}`);
      } else {
        // Create a real MongoDB user if it doesn't exist
        const newDemoUser = new User({
          username: 'demo',
          email: 'demo@example.com',
          passwordHash: 'password123', // Will be hashed by the User model pre-save hook
          role: 'user',
          isVerified: true
        });
        
        await newDemoUser.save();
        req.user = { id: newDemoUser._id, username: newDemoUser.username, role: newDemoUser.role };
        logger.info(`Created demo user for development: ${newDemoUser._id}`);
      }
      return next();
    } catch (error) {
      logger.error('Error setting up demo user:', error);
      return res.status(500).json({ message: 'Server error setting up demo user' });
    }
  }

  // Get token from header, query, or cookie
  const token = req.header('x-auth-token') || 
                req.query.token || 
                req.cookies.token;

  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'No authentication token, access denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user from payload to request
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn('Authentication error', { error: error.message });
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Middleware to check if user is an admin
const authorizeAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  
  return res.status(403).json({ message: 'Access denied: Admin privilege required' });
};

// Middleware to check if user is owner or admin
const authorizeOwnerOrAdmin = (req, res, next) => {
  const resourceUserId = req.params.userId || req.body.userId;
  
  if (!resourceUserId) {
    return res.status(400).json({ message: 'User ID is required' });
  }
  
  if (req.user.id === resourceUserId || req.user.role === 'admin') {
    return next();
  }
  
  return res.status(403).json({ message: 'Access denied: Not the owner' });
};

module.exports = { authenticate, authorizeAdmin, authorizeOwnerOrAdmin }; 