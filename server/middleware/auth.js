const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to authenticate users with JWT
exports.authenticate = async (req, res, next) => {
  try {
    let token;
    
    // Check if token exists in authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } 
    // Check if token exists in cookies
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    
    // If no token found, return unauthorized
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized to access this route' 
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user by id
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired' 
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during authentication' 
    });
  }
};

// Middleware to check if user is admin
exports.authorizeAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin access required for this route' 
    });
  }
};

// Middleware to check if user owns a resource or is admin
exports.authorizeOwnerOrAdmin = (model) => async (req, res, next) => {
  try {
    const resourceId = req.params.id;
    const resource = await model.findById(resourceId);
    
    if (!resource) {
      return res.status(404).json({ 
        success: false, 
        message: 'Resource not found' 
      });
    }
    
    // Check if user is owner or admin
    if (
      (resource.userId && resource.userId.toString() === req.user.id) || 
      req.user.role === 'admin'
    ) {
      req.resource = resource; // Attach resource to request for later use
      next();
    } else {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to access this resource' 
      });
    }
  } catch (error) {
    console.error('Authorization error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during authorization' 
    });
  }
}; 