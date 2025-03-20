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
const s3Service = require('../services/s3Service');

// Initialize S3 service
s3Service.initialize();

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
  let tempFiles = [];
  
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }
    
    tempFiles.push(req.file.path);
    
    const { title, description, position, folderId, tags } = req.body;
    const boardId = req.body.boardId;
    
    // Upload to S3 with our improved service
    const uniqueFileName = path.basename(req.file.path);
    const { imageUrl, thumbnailUrl, metadata } = await s3Service.uploadImageWithThumbnail(
      req.file.path,
      uniqueFileName,
      req.file.mimetype
    );
    
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
      },
      s3Key: s3Service.getKeyFromUrl(imageUrl),
      thumbnailKey: s3Service.getKeyFromUrl(thumbnailUrl)
    });
    
    const savedImage = await newImage.save();
    
    // Clean up temp files
    tempFiles.forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });
    
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
    
    // Clean up temp files
    tempFiles.forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });
    
    res.status(500).json({ message: `Server error during image upload: ${error.message}` });
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
// @access  Private
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }
    
    // Check if user is owner of the image or has admin rights
    if (image.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this image' });
    }
    
    // Check if board exists and user has rights
    const board = await Board.findById(image.boardId);
    if (!board) {
      return res.status(404).json({ message: 'Associated board not found' });
    }
    
    const isOwner = board.userId.toString() === req.user.id;
    const isAdmin = board.collaborators.some(
      collab => collab.userId.toString() === req.user.id && collab.role === 'admin'
    );
    
    if (!isOwner && !isAdmin && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete images from this board' });
    }
    
    // Remove from S3 if stored there
    if (image.metadata.storageProvider === 's3') {
      await image.deleteFromS3();
    }
    
    // Remove the image
    await image.remove();
    
    // Notify clients
    socketio.io.to(`board:${image.boardId}`).emit('image:delete', {
      imageId: image._id,
      boardId: image.boardId
    });
    
    res.json({
      success: true,
      message: 'Image deleted',
      imageId: req.params.id
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ message: 'Server error' });
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

// Get all images
router.get('/', (req, res) => {
  res.status(200).json({ 
    images: [
      { id: '1', url: '/api/placeholder/400/300', title: 'Image 1' },
      { id: '2', url: '/api/placeholder/300/400', title: 'Image 2' },
      { id: '3', url: '/api/placeholder/500/300', title: 'Image 3' }
    ]
  });
});

// Get image by ID
router.get('/:id', (req, res) => {
  res.status(200).json({ 
    image: { 
      id: req.params.id, 
      url: '/api/placeholder/400/300',
      title: `Image ${req.params.id}`,
      width: 400,
      height: 300
    }
  });
});

module.exports = router; 