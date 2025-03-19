const express = require('express');
const router = express.Router();
const { authenticate, authorizeOwnerOrAdmin } = require('../middleware/auth');
const Board = require('../models/Board');
const Image = require('../models/Image');
const socketio = require('../services/socketio');

// @route   POST /api/boards
// @desc    Create a new board
// @access  Private
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, description, isPublic, background, folderId } = req.body;
    
    // Create new board
    const board = new Board({
      userId: req.user.id,
      title,
      description,
      isPublic: isPublic || false,
      background: background || 'white',
      folderId: folderId || null
    });
    
    await board.save();
    
    // Notify clients about new board
    if (board.isPublic) {
      socketio.io.emit('feed:update', {
        type: 'new-board',
        userId: req.user.id,
        username: req.user.username,
        boardId: board._id,
        boardTitle: board.title
      });
    }
    
    res.status(201).json({
      success: true,
      board
    });
  } catch (error) {
    console.error('Create board error:', error);
    res.status(500).json({ message: 'Server error during board creation' });
  }
});

// @route   GET /api/boards
// @desc    Get all boards for current user
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const { folderId } = req.query;
    
    // Build query
    const query = { userId: req.user.id };
    
    // Filter by folder if provided
    if (folderId) {
      query.folderId = folderId;
    }
    
    // Get boards
    const boards = await Board.find(query).sort({ updatedAt: -1 });
    
    res.json({
      success: true,
      count: boards.length,
      boards
    });
  } catch (error) {
    console.error('Get boards error:', error);
    res.status(500).json({ message: 'Server error while fetching boards' });
  }
});

// @route   GET /api/boards/public
// @desc    Get public boards
// @access  Public
router.get('/public', async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get public boards
    const boards = await Board.find({ isPublic: true })
      .sort({ viewCount: -1, updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'username profileGif');
    
    // Get total count
    const total = await Board.countDocuments({ isPublic: true });
    
    res.json({
      success: true,
      count: boards.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      boards
    });
  } catch (error) {
    console.error('Get public boards error:', error);
    res.status(500).json({ message: 'Server error while fetching public boards' });
  }
});

// @route   GET /api/boards/:id
// @desc    Get a board by ID
// @access  Private/Public (depending on board visibility)
router.get('/:id', async (req, res) => {
  try {
    const board = await Board.findById(req.params.id)
      .populate('userId', 'username profileGif');
    
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }
    
    // Check if board is public or user is owner
    const isOwner = req.user && board.userId.toString() === req.user.id;
    const isCollaborator = req.user && board.collaborators.some(
      collab => collab.userId.toString() === req.user.id
    );
    
    if (!board.isPublic && !isOwner && !isCollaborator) {
      return res.status(403).json({ message: 'Not authorized to view this board' });
    }
    
    // Increment view count if not owner
    if (!isOwner) {
      board.viewCount += 1;
      await board.save();
    }
    
    // Get images for this board
    const images = await Image.find({ boardId: board._id, isArchived: false });
    
    res.json({
      success: true,
      board,
      images
    });
  } catch (error) {
    console.error('Get board error:', error);
    res.status(500).json({ message: 'Server error while fetching board' });
  }
});

// @route   PUT /api/boards/:id
// @desc    Update a board
// @access  Private (owner only)
router.put('/:id', authenticate, authorizeOwnerOrAdmin(Board), async (req, res) => {
  try {
    const { title, description, isPublic, background, customBackground, settings } = req.body;
    
    // Build update object
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (background !== undefined) updateData.background = background;
    if (customBackground !== undefined) updateData.customBackground = customBackground;
    if (settings) updateData.settings = { ...req.resource.settings, ...settings };
    
    // Update board
    const board = await Board.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    // Notify clients about board update
    socketio.io.to(`board:${board._id}`).emit('board:update', {
      boardId: board._id,
      updates: updateData
    });
    
    res.json({
      success: true,
      board
    });
  } catch (error) {
    console.error('Update board error:', error);
    res.status(500).json({ message: 'Server error during board update' });
  }
});

// @route   DELETE /api/boards/:id
// @desc    Delete a board
// @access  Private (owner only)
router.delete('/:id', authenticate, authorizeOwnerOrAdmin(Board), async (req, res) => {
  try {
    const board = req.resource;
    
    // Delete all images associated with this board
    await Image.deleteMany({ boardId: board._id });
    
    // Delete the board
    await board.remove();
    
    // Notify clients about board deletion
    socketio.io.emit('board:delete', {
      boardId: board._id,
      userId: req.user.id
    });
    
    res.json({
      success: true,
      message: 'Board deleted successfully'
    });
  } catch (error) {
    console.error('Delete board error:', error);
    res.status(500).json({ message: 'Server error during board deletion' });
  }
});

// @route   POST /api/boards/:id/collaborators
// @desc    Add collaborator to board
// @access  Private (owner only)
router.post('/:id/collaborators', authenticate, authorizeOwnerOrAdmin(Board), async (req, res) => {
  try {
    const { userId, role } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    const board = req.resource;
    
    // Check if user is already a collaborator
    const existingCollaborator = board.collaborators.find(
      collab => collab.userId.toString() === userId
    );
    
    if (existingCollaborator) {
      return res.status(400).json({ message: 'User is already a collaborator' });
    }
    
    // Add collaborator
    board.collaborators.push({
      userId,
      role: role || 'viewer',
      addedAt: new Date()
    });
    
    await board.save();
    
    // Notify clients about new collaborator
    socketio.io.to(`board:${board._id}`).emit('board:collaborator:add', {
      boardId: board._id,
      userId,
      role: role || 'viewer'
    });
    
    res.json({
      success: true,
      board
    });
  } catch (error) {
    console.error('Add collaborator error:', error);
    res.status(500).json({ message: 'Server error while adding collaborator' });
  }
});

// @route   DELETE /api/boards/:id/collaborators/:userId
// @desc    Remove collaborator from board
// @access  Private (owner only)
router.delete('/:id/collaborators/:userId', authenticate, authorizeOwnerOrAdmin(Board), async (req, res) => {
  try {
    const board = req.resource;
    const collaboratorId = req.params.userId;
    
    // Remove collaborator
    board.collaborators = board.collaborators.filter(
      collab => collab.userId.toString() !== collaboratorId
    );
    
    await board.save();
    
    // Notify clients about removed collaborator
    socketio.io.to(`board:${board._id}`).emit('board:collaborator:remove', {
      boardId: board._id,
      userId: collaboratorId
    });
    
    res.json({
      success: true,
      board
    });
  } catch (error) {
    console.error('Remove collaborator error:', error);
    res.status(500).json({ message: 'Server error while removing collaborator' });
  }
});

module.exports = router; 