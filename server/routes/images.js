const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const { authenticate, authorizeOwnerOrAdmin } = require('../middleware/auth');
const Image = require('../models/Image');
const Board = require('../models/Board');
const socketio = require('../services/socketio');

// AWS S3 Configuration
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

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

// Helper to upload file to S3
const uploadToS3 = async (filePath, fileName, contentType) => {
  const fileContent = fs.readFileSync(filePath);
  
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `images/${fileName}`,
    Body: fileContent,
    ContentType: contentType,
    ACL: 'public-read'
  };
  
  const data = await s3.upload(params).promise();
  return data.Location;
};

// Middleware to validate board ownership or collaboration rights
const validateBoardAccess = async (req, res, next) => {
  try {
    const boardId = req.body.boardId || req.query.boardId;
    
    if (!boardId) {
      return res.status(400).json({ message: 'Board ID is required' });
    }
    
    const board = await Board.findById(boardId);
    
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }
    
    // Check if user is owner or collaborator with edit rights
    const isOwner = board.userId.toString() === req.user.id;
    const isEditor = board.collaborators.some(
      collab => collab.userId.toString() === req.user.id && 
                ['editor', 'admin'].includes(collab.role)
    );
    
    if (!isOwner && !isEditor) {
      return res.status(403).json({ message: 'You do not have permission to add to this board' });
    }
    
    req.board = board;
    next();
  } catch (error) {
    console.error('Error validating board access:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   POST /api/images/upload
// @desc    Upload an image
// @access  Private
router.post('/upload', authenticate, validateBoardAccess, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }
    
    const { title, description, position, folderId, tags } = req.body;
    const boardId = req.body.boardId;
    
    // Get image dimensions
    const metadata = await sharp(req.file.path).metadata();
    
    // Generate a thumbnail
    const thumbnailFileName = `thumbnail-${path.basename(req.file.path)}`;
    const thumbnailPath = path.join(path.dirname(req.file.path), thumbnailFileName);
    
    await sharp(req.file.path)
      .resize(300, 300, { fit: 'inside' })
      .toFile(thumbnailPath);
    
    // Upload original image and thumbnail to S3
    const imageUrl = await uploadToS3(req.file.path, path.basename(req.file.path), req.file.mimetype);
    const thumbnailUrl = await uploadToS3(thumbnailPath, thumbnailFileName, 'image/jpeg');
    
    // Parse position data
    let positionData = {
      x: 0,
      y: 0,
      width: metadata.width > 600 ? 600 : metadata.width,
      height: metadata.height > 400 ? 400 : metadata.height,
      zIndex: 1,
      rotation: 0
    };
    
    if (position) {
      try {
        const parsedPosition = JSON.parse(position);
        positionData = { ...positionData, ...parsedPosition };
      } catch (e) {
        console.error('Error parsing position data:', e);
      }
    }
    
    // Parse tags
    let tagArray = [];
    if (tags) {
      try {
        tagArray = JSON.parse(tags);
      } catch (e) {
        // If tags is a string, split by comma
        tagArray = tags.split(',').map(tag => tag.trim());
      }
    }
    
    // Create new image record
    const newImage = new Image({
      boardId,
      userId: req.user.id,
      url: imageUrl,
      thumbnail: thumbnailUrl,
      title: title || req.file.originalname,
      description: description || '',
      position: positionData,
      tags: tagArray,
      folderId: folderId || null,
      metadata: {
        originalFilename: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        dimensions: {
          width: metadata.width,
          height: metadata.height
        }
      }
    });
    
    const savedImage = await newImage.save();
    
    // Clean up temp files
    fs.unlinkSync(req.file.path);
    fs.unlinkSync(thumbnailPath);
    
    // Notify clients about new image
    socketio.io.to(`board:${boardId}`).emit('image:add', savedImage);
    
    // Add to the public feed if the board is public
    if (req.board.isPublic) {
      socketio.io.emit('feed:update', {
        type: 'new-image',
        userId: req.user.id,
        username: req.user.username,
        boardId,
        boardTitle: req.board.title,
        imageId: savedImage._id,
        thumbnail: savedImage.thumbnail
      });
    }
    
    res.status(201).json({
      success: true,
      image: savedImage
    });
  } catch (error) {
    console.error('Image upload error:', error);
    
    // Clean up temp file if it exists
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ message: 'Server error during image upload' });
  }
});

// @route   GET /api/images
// @desc    Get images for a board
// @access  Private/Public (depending on board visibility)
router.get('/', async (req, res) => {
  try {
    const { boardId } = req.query;
    
    if (!boardId) {
      return res.status(400).json({ message: 'Board ID is required' });
    }
    
    // Check board visibility
    const board = await Board.findById(boardId);
    
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }
    
    // Check if board is public or user is owner/collaborator
    const isPublicAccess = board.isPublic;
    const isOwner = req.user && board.userId.toString() === req.user.id;
    const isCollaborator = req.user && board.collaborators.some(
      collab => collab.userId.toString() === req.user.id
    );
    
    if (!isPublicAccess && !isOwner && !isCollaborator) {
      return res.status(403).json({ message: 'Not authorized to view images from this board' });
    }
    
    // Get images
    const images = await Image.find({ 
      boardId, 
      isArchived: false 
    }).sort({ 'position.zIndex': 1 });
    
    res.json({
      success: true,
      count: images.length,
      images
    });
  } catch (error) {
    console.error('Get images error:', error);
    res.status(500).json({ message: 'Server error while fetching images' });
  }
});

// @route   GET /api/images/:id
// @desc    Get an image by ID
// @access  Private/Public (depending on board visibility)
router.get('/:id', async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }
    
    // Check board visibility
    const board = await Board.findById(image.boardId);
    
    if (!board) {
      return res.status(404).json({ message: 'Associated board not found' });
    }
    
    // Check if board is public or user is owner/collaborator
    const isPublicAccess = board.isPublic;
    const isOwner = req.user && board.userId.toString() === req.user.id;
    const isCollaborator = req.user && board.collaborators.some(
      collab => collab.userId.toString() === req.user.id
    );
    
    if (!isPublicAccess && !isOwner && !isCollaborator) {
      return res.status(403).json({ message: 'Not authorized to view this image' });
    }
    
    res.json({
      success: true,
      image
    });
  } catch (error) {
    console.error('Get image error:', error);
    res.status(500).json({ message: 'Server error while fetching image' });
  }
});

// @route   PUT /api/images/:id
// @desc    Update an image
// @access  Private (owner only)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { title, description, position, tags, folderId } = req.body;
    
    // Find image
    const image = await Image.findById(req.params.id);
    
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }
    
    // Check if user is owner
    if (image.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this image' });
    }
    
    // Build update object
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (folderId !== undefined) updateData.folderId = folderId;
    
    // Update position if provided
    if (position) {
      updateData.position = { ...image.position, ...position };
    }
    
    // Update tags if provided
    if (tags) {
      let tagArray = [];
      try {
        tagArray = JSON.parse(tags);
      } catch (e) {
        // If tags is a string, split by comma
        tagArray = tags.split(',').map(tag => tag.trim());
      }
      updateData.tags = tagArray;
    }
    
    // Update image
    const updatedImage = await Image.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    // Notify clients about image update
    socketio.io.to(`board:${image.boardId}`).emit('image:update', {
      imageId: updatedImage._id,
      updates: updateData
    });
    
    res.json({
      success: true,
      image: updatedImage
    });
  } catch (error) {
    console.error('Update image error:', error);
    res.status(500).json({ message: 'Server error during image update' });
  }
});

// @route   PUT /api/images/:id/position
// @desc    Update image position
// @access  Private
router.put('/:id/position', authenticate, async (req, res) => {
  try {
    const { x, y, width, height, zIndex, rotation } = req.body;
    
    // Find image
    const image = await Image.findById(req.params.id);
    
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }
    
    // Check board access
    const board = await Board.findById(image.boardId);
    
    if (!board) {
      return res.status(404).json({ message: 'Associated board not found' });
    }
    
    // Check if user is owner or collaborator with edit rights
    const isOwner = board.userId.toString() === req.user.id;
    const isEditor = board.collaborators.some(
      collab => collab.userId.toString() === req.user.id && 
                ['editor', 'admin'].includes(collab.role)
    );
    
    if (!isOwner && !isEditor) {
      return res.status(403).json({ message: 'Not authorized to update this image' });
    }
    
    // Build position update
    const positionUpdate = {};
    if (x !== undefined) positionUpdate.x = x;
    if (y !== undefined) positionUpdate.y = y;
    if (width !== undefined) positionUpdate.width = width;
    if (height !== undefined) positionUpdate.height = height;
    if (zIndex !== undefined) positionUpdate.zIndex = zIndex;
    if (rotation !== undefined) positionUpdate.rotation = rotation;
    
    // Update image position
    image.position = { ...image.position, ...positionUpdate };
    await image.save();
    
    // Notify clients about position update
    socketio.io.to(`board:${image.boardId}`).emit('image:moved', {
      imageId: image._id,
      position: image.position,
      userId: req.user.id
    });
    
    res.json({
      success: true,
      position: image.position
    });
  } catch (error) {
    console.error('Update image position error:', error);
    res.status(500).json({ message: 'Server error during position update' });
  }
});

// @route   DELETE /api/images/:id
// @desc    Delete an image
// @access  Private (owner only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }
    
    // Check if user is owner
    if (image.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this image' });
    }
    
    // Delete from S3 if needed
    // Note: You might want to keep the files on S3 and just mark as deleted in the database
    // to avoid broken links and allow for recovery
    
    // Delete the image from database
    await image.remove();
    
    // Notify clients about image deletion
    socketio.io.to(`board:${image.boardId}`).emit('image:delete', {
      imageId: image._id,
      boardId: image.boardId
    });
    
    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ message: 'Server error during image deletion' });
  }
});

// @route   GET /api/images/user/:userId
// @desc    Get images by user
// @access  Private/Public
router.get('/user/:userId', async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get public boards for this user
    const publicBoardIds = await Board.find({ 
      userId: req.params.userId, 
      isPublic: true 
    }).distinct('_id');
    
    // Build query
    const query = { 
      userId: req.params.userId,
      isArchived: false
    };
    
    // If not the owner, only show images from public boards
    if (!req.user || req.user.id !== req.params.userId) {
      query.boardId = { $in: publicBoardIds };
    }
    
    // Get images
    const images = await Image.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('boardId', 'title');
    
    // Get total count
    const total = await Image.countDocuments(query);
    
    res.json({
      success: true,
      count: images.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      images
    });
  } catch (error) {
    console.error('Get user images error:', error);
    res.status(500).json({ message: 'Server error while fetching user images' });
  }
});

module.exports = router; 