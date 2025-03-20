const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Folder = require('../models/Folder');
const Board = require('../models/Board');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');

// Get all folders for the authenticated user
router.get('/', authenticate, async (req, res) => {
  try {
    logger.debug(`Fetching folders for user: ${req.user.id}`);
    const folders = await Folder.find({ userId: req.user.id });
    
    res.status(200).json({
      folders: folders.map(folder => ({
        _id: folder._id,
        name: folder.name,
        description: folder.description,
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt
      }))
    });
  } catch (error) {
    logger.error('Error fetching folders:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get folder by ID with its boards
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    logger.debug(`Fetching folder ${id} for user: ${req.user.id}`);
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid folder ID' });
    }
    
    const folder = await Folder.findById(id);
    
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }
    
    logger.debug(`Folder userId: ${folder.userId}, User id: ${req.user.id}`);
    
    // Check ownership - convert both to strings for comparison
    if (folder.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access this folder' });
    }
    
    // Get boards in this folder
    const boards = await Board.find({ folderId: id, userId: req.user.id });
    
    // Get subfolders in this folder
    const subfolders = await Folder.find({ parentId: id, userId: req.user.id });
    
    res.status(200).json({
      folder: {
        _id: folder._id,
        name: folder.name,
        description: folder.description,
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt,
        boards: boards.map(board => ({
          _id: board._id,
          title: board.title,
          description: board.description,
          thumbnail: '/api/placeholder/200/200',
          isPublic: board.isPublic,
          background: board.background
        }))
      },
      subfolders: subfolders.map(subfolder => ({
        _id: subfolder._id,
        name: subfolder.name,
        description: subfolder.description,
        color: subfolder.color,
        icon: subfolder.icon
      }))
    });
  } catch (error) {
    logger.error(`Error fetching folder ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new folder
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, description } = req.body;
    logger.debug(`Creating folder for user: ${req.user.id}`);
    
    if (!name) {
      return res.status(400).json({ message: 'Folder name is required' });
    }
    
    const folder = new Folder({
      name,
      description: description || '',
      userId: req.user.id
    });
    
    await folder.save();
    
    res.status(201).json({
      message: 'Folder created',
      folder: {
        id: folder._id,
        name: folder.name
      }
    });
  } catch (error) {
    logger.error('Error creating folder:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update folder
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    logger.debug(`Updating folder ${id} for user: ${req.user.id}`);
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid folder ID' });
    }
    
    // Find folder
    const folder = await Folder.findById(id);
    
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }
    
    // Check ownership - convert both to strings for comparison
    if (folder.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this folder' });
    }
    
    // Update fields
    if (name) folder.name = name;
    if (description !== undefined) folder.description = description;
    
    await folder.save();
    
    res.status(200).json({
      message: 'Folder updated',
      folder: {
        id: folder._id,
        name: folder.name,
        description: folder.description
      }
    });
  } catch (error) {
    logger.error(`Error updating folder ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete folder
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    logger.debug(`Deleting folder ${id} for user: ${req.user.id}`);
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid folder ID' });
    }
    
    // Find folder
    const folder = await Folder.findById(id);
    
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }
    
    // Check ownership - convert both to strings for comparison
    if (folder.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this folder' });
    }
    
    // Delete the folder
    await folder.deleteOne();
    
    // Optionally: Remove folder ID from all boards in this folder
    await Board.updateMany(
      { folderId: id },
      { $set: { folderId: null } }
    );
    
    res.status(200).json({ message: 'Folder deleted' });
  } catch (error) {
    logger.error(`Error deleting folder ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 