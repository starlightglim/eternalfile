// imageCombineService.js - Backend service for AI image combination

const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const { authenticate } = require('../middleware/auth');
const Image = require('../models/Image');
const User = require('../models/User');
const Board = require('../models/Board');
const socketio = require('../services/socketio');

// Configure multer for temporary file storage
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      cb(null, tempDir);
    },
    filename: (req, file, cb) => {
      cb(null, `${uuidv4()}-${file.originalname}`);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Only accept images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// AI service configuration
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000/combine';
const AI_API_KEY = process.env.AI_API_KEY;

// S3 Configuration
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// Helper to upload file to S3
const uploadToS3 = async (filePath, fileName) => {
  const fileContent = fs.readFileSync(filePath);
  
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `images/${fileName}`,
    Body: fileContent,
    ContentType: 'image/png',
    ACL: 'public-read'
  };
  
  const data = await s3.upload(params).promise();
  return data.Location;
};

// Middleware to validate board ownership
const validateBoardOwnership = async (req, res, next) => {
  try {
    const board = await Board.findById(req.body.boardId);
    
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }
    
    if (board.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to add to this board' });
    }
    
    next();
  } catch (error) {
    console.error('Error validating board ownership:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Endpoint to merge images using AI
router.post('/merge', authenticate, validateBoardOwnership, async (req, res) => {
  try {
    const { imageIds, boardId, position, title } = req.body;
    
    if (!imageIds || !Array.isArray(imageIds) || imageIds.length < 2) {
      return res.status(400).json({ message: 'At least two image IDs are required' });
    }
    
    // Create a job ID for tracking
    const jobId = uuidv4();
    
    // Notify client that processing has started
    socketio.io.to(req.user.id).emit('image:processing', {
      jobId,
      status: 'started',
      progress: 0
    });
    
    // Get the images from the database
    const images = await Image.find({ _id: { $in: imageIds } });
    
    if (images.length !== imageIds.length) {
      return res.status(404).json({ message: 'One or more images not found' });
    }
    
    // Prepare the payload for the AI service
    const imageUrls = images.map(img => img.url);
    
    // Send to AI service
    socketio.io.to(req.user.id).emit('image:processing', {
      jobId,
      status: 'processing',
      progress: 30
    });
    
    // Instead of calling an external AI service, we'll use sharp to create a simple composite image
    // This is a simplified mock implementation
    try {
      // Create a blank canvas
      const width = 800;
      const height = 600;
      
      // Create a simple gradient background
      const resultFileName = `${jobId}-result.png`;
      const tempFilePath = path.join(__dirname, '../temp', resultFileName);
      
      // Create a simple gradient image
      await sharp({
        create: {
          width,
          height,
          channels: 4,
          background: { r: 100, g: 100, b: 100, alpha: 1 }
        }
      })
      .png()
      .toFile(tempFilePath);
      
      socketio.io.to(req.user.id).emit('image:processing', {
        jobId,
        status: 'processing',
        progress: 70
      });
      
      // Generate a thumbnail
      const thumbnailPath = path.join(__dirname, '../temp', `${jobId}-thumbnail.png`);
      await sharp(tempFilePath)
        .resize(300, 300, { fit: 'inside' })
        .toFile(thumbnailPath);
      
      // For demo purposes, we'll just use local URLs instead of S3
      // In a real implementation, you would upload to S3
      const imageUrl = `/api/placeholder/800/600`;
      const thumbnailUrl = `/api/placeholder/300/300`;
      
      // Create new image record in database
      const newImage = new Image({
        boardId,
        userId: req.user.id,
        url: imageUrl,
        thumbnail: thumbnailUrl,
        title: title || 'AI Combined Image',
        position: position || { x: 0, y: 0, width: 400, height: 400, zIndex: 1 },
        isAIGenerated: true,
        parentImages: imageIds,
        metadata: {
          generatedAt: new Date(),
          jobId
        }
      });
      
      const savedImage = await newImage.save();
      
      // Clean up temp files
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
      }
      
      // Notify clients about the new image
      socketio.io.to(boardId).emit('image:add', savedImage);
      
      // Finalize the job
      socketio.io.to(req.user.id).emit('image:processing', {
        jobId,
        status: 'completed',
        progress: 100,
        imageId: savedImage._id
      });
      
      // Add to the public feed if the board is public
      const board = await Board.findById(boardId);
      if (board.isPublic) {
        socketio.io.emit('feed:update', {
          type: 'new-ai-image',
          userId: req.user.id,
          username: req.user.username,
          boardId,
          boardTitle: board.title,
          imageId: savedImage._id,
          thumbnail: savedImage.thumbnail
        });
      }
      
      res.status(201).json(savedImage);
    } catch (error) {
      console.error('Error in image processing:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in AI image combination:', error);
    
    // Notify user of error
    if (req.body.jobId) {
      socketio.io.to(req.user.id).emit('image:processing', {
        jobId: req.body.jobId,
        status: 'error',
        error: 'Failed to process images'
      });
    }
    
    res.status(500).json({ message: 'Error processing images' });
  }
});

// Mock AI service for testing (development use only)
if (process.env.NODE_ENV === 'development') {
  router.get('/mock-ai-service', (req, res) => {
    // This is a development-only endpoint to simulate the AI service
    // In production, you would use an actual AI service API
    
    // Simulate processing time
    setTimeout(() => {
      // Send a placeholder image
      res.redirect('/api/placeholder/800/600');
    }, 2000); // Simulate 2 second processing time
  });
}

// Endpoint to get a user's AI-generated images
router.get('/ai-generated', authenticate, async (req, res) => {
  try {
    const images = await Image.find({
      userId: req.user.id,
      isAIGenerated: true
    }).sort({ createdAt: -1 }).limit(50);
    
    res.json(images);
  } catch (error) {
    console.error('Error fetching AI-generated images:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Endpoint to get the history of an AI-generated image
router.get('/:id/history', authenticate, async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }
    
    if (!image.isAIGenerated) {
      return res.status(400).json({ message: 'This is not an AI-generated image' });
    }
    
    // Get the parent images
    const parentImages = await Image.find({ _id: { $in: image.parentImages } });
    
    res.json({
      current: image,
      parents: parentImages
    });
  } catch (error) {
    console.error('Error fetching image history:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 