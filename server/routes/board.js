const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Board = require('../models/Board');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');

// Get all boards for the authenticated user
router.get('/', authenticate, async (req, res) => {
  try {
    logger.debug(`Fetching boards for user: ${req.user.id}`);
    const boards = await Board.find({ userId: req.user.id });
    
    res.status(200).json({ 
      boards: boards.map(board => ({
        id: board._id,
        title: board.title,
        description: board.description,
        thumbnail: '/api/placeholder/200/200', // Placeholder for now
        isPublic: board.isPublic,
        folderId: board.folderId,
        background: board.background
      }))
    });
  } catch (error) {
    logger.error('Error fetching boards:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get public boards
router.get('/public', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const total = await Board.countDocuments({ isPublic: true });
    const boards = await Board.find({ isPublic: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'username profileGif');
    
    const pages = Math.ceil(total / limit);
    
    res.status(200).json({
      boards: boards.map(board => ({
        _id: board._id,
        title: board.title,
        description: board.description,
        thumbnail: '/api/placeholder/200/200', // Placeholder for now
        isPublic: board.isPublic,
        owner: {
          _id: board.userId._id,
          username: board.userId.username,
          profileGif: board.userId.profileGif
        },
        createdAt: board.createdAt,
        updatedAt: board.updatedAt
      })),
      total,
      pages,
      currentPage: page
    });
  } catch (error) {
    logger.error('Error fetching public boards:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get board by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    logger.debug(`Fetching board ${id} for user: ${req.user.id}`);
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid board ID' });
    }
    
    const board = await Board.findById(id);
    
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }
    
    logger.debug(`Board userId: ${board.userId}, User id: ${req.user.id}`);
    
    // Check if user has access to the board - convert both to strings for comparison
    if (board.userId.toString() !== req.user.id.toString() && !board.isPublic) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.status(200).json({ 
      board: {
        id: board._id,
        title: board.title,
        description: board.description,
        isPublic: board.isPublic,
        background: board.background,
        customBackground: board.customBackground,
        folderId: board.folderId,
        userId: board.userId,
        settings: board.settings,
        lastActivity: board.lastActivity,
        // In a real app, we'd populate this with actual images
        images: [
          { id: '1', url: '/api/placeholder/400/300', x: 100, y: 100, width: 400, height: 300 },
          { id: '2', url: '/api/placeholder/300/400', x: 600, y: 200, width: 300, height: 400 }
        ]
      }
    });
  } catch (error) {
    logger.error(`Error fetching board ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new board
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, description, isPublic, background, folderId } = req.body;
    
    const board = new Board({
      title,
      description,
      isPublic: isPublic || false,
      background: background || 'white',
      userId: req.user.id,
      folderId
    });
    
    await board.save();
    
    res.status(201).json({ 
      message: 'Board created successfully', 
      board: {
        id: board._id,
        title: board.title,
        description: board.description,
        isPublic: board.isPublic,
        background: board.background,
        folderId: board.folderId
      }
    });
  } catch (error) {
    logger.error('Error creating board:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update board
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    logger.debug(`Updating board ${id} for user: ${req.user.id}`);
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid board ID' });
    }
    
    // Find board
    const board = await Board.findById(id);
    
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }
    
    // Check ownership - convert both to strings for comparison
    if (board.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this board' });
    }
    
    // Update fields
    const allowedUpdates = ['title', 'description', 'isPublic', 'background', 'customBackground', 'folderId', 'settings'];
    
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        board[field] = updates[field];
      }
    });
    
    await board.save();
    
    res.status(200).json({ 
      message: 'Board updated', 
      board: {
        id: board._id,
        title: board.title,
        description: board.description,
        isPublic: board.isPublic,
        background: board.background,
        folderId: board.folderId
      }
    });
  } catch (error) {
    logger.error(`Error updating board ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete board
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    logger.debug(`Deleting board ${id} for user: ${req.user.id}`);
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid board ID' });
    }
    
    // Find board
    const board = await Board.findById(id);
    
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }
    
    // Check ownership - convert both to strings for comparison
    if (board.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this board' });
    }
    
    await board.deleteOne();
    
    res.status(200).json({ message: 'Board deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting board ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 