const express = require('express');
const router = express.Router();
const { authenticate, authorizeOwnerOrAdmin } = require('../middleware/auth');
const Folder = require('../models/Folder');
const Board = require('../models/Board');
const Image = require('../models/Image');

// @route   POST /api/folders
// @desc    Create a new folder
// @access  Private
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, description, color, icon, parentId } = req.body;
    
    // Validate parent folder if provided
    if (parentId) {
      const parentFolder = await Folder.findById(parentId);
      
      if (!parentFolder) {
        return res.status(404).json({ message: 'Parent folder not found' });
      }
      
      if (parentFolder.userId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to use this parent folder' });
      }
    }
    
    // Create new folder
    const folder = new Folder({
      userId: req.user.id,
      name,
      description: description || '',
      color: color || '#CCCCCC',
      icon: icon || 'folder',
      parentId: parentId || null
    });
    
    await folder.save();
    
    res.status(201).json({
      success: true,
      folder
    });
  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({ message: 'Server error during folder creation' });
  }
});

// @route   GET /api/folders
// @desc    Get all folders for current user
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const { parentId } = req.query;
    
    // Build query
    const query = { userId: req.user.id };
    
    // Filter by parent folder if provided
    if (parentId) {
      query.parentId = parentId === 'null' ? null : parentId;
    }
    
    // Get folders
    const folders = await Folder.find(query).sort({ sortOrder: 1, name: 1 });
    
    res.json({
      success: true,
      count: folders.length,
      folders
    });
  } catch (error) {
    console.error('Get folders error:', error);
    res.status(500).json({ message: 'Server error while fetching folders' });
  }
});

// @route   GET /api/folders/:id
// @desc    Get a folder by ID
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);
    
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }
    
    // Check if user is owner
    if (folder.userId.toString() !== req.user.id) {
      // Check if folder is shared with user
      const isSharedWithUser = folder.isShared && folder.sharedWith.some(
        share => share.userId.toString() === req.user.id
      );
      
      if (!isSharedWithUser) {
        return res.status(403).json({ message: 'Not authorized to view this folder' });
      }
    }
    
    // Get subfolders
    const subfolders = await Folder.find({ 
      parentId: folder._id,
      $or: [
        { userId: req.user.id },
        { isShared: true, 'sharedWith.userId': req.user.id }
      ]
    }).sort({ sortOrder: 1, name: 1 });
    
    // Get boards in this folder
    const boards = await Board.find({ 
      folderId: folder._id,
      $or: [
        { userId: req.user.id },
        { 'collaborators.userId': req.user.id }
      ]
    }).sort({ updatedAt: -1 });
    
    // Get images in this folder
    const images = await Image.find({ 
      folderId: folder._id,
      userId: req.user.id,
      isArchived: false
    }).sort({ createdAt: -1 }).limit(20);
    
    res.json({
      success: true,
      folder,
      subfolders,
      boards,
      images
    });
  } catch (error) {
    console.error('Get folder error:', error);
    res.status(500).json({ message: 'Server error while fetching folder' });
  }
});

// @route   PUT /api/folders/:id
// @desc    Update a folder
// @access  Private
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, description, color, icon, parentId, isShared, sortOrder } = req.body;
    
    // Find folder
    const folder = await Folder.findById(req.params.id);
    
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }
    
    // Check if user is owner
    if (folder.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this folder' });
    }
    
    // Validate parent folder if provided and changed
    if (parentId && parentId !== folder.parentId?.toString()) {
      // Prevent circular references
      if (parentId === folder._id.toString()) {
        return res.status(400).json({ message: 'Folder cannot be its own parent' });
      }
      
      const parentFolder = await Folder.findById(parentId);
      
      if (!parentFolder) {
        return res.status(404).json({ message: 'Parent folder not found' });
      }
      
      if (parentFolder.userId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to use this parent folder' });
      }
      
      // Check if the new parent is a descendant of this folder (would create a loop)
      let currentParent = parentFolder;
      while (currentParent.parentId) {
        if (currentParent.parentId.toString() === folder._id.toString()) {
          return res.status(400).json({ message: 'Cannot move a folder to its own descendant' });
        }
        currentParent = await Folder.findById(currentParent.parentId);
      }
    }
    
    // Build update object
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (color !== undefined) updateData.color = color;
    if (icon !== undefined) updateData.icon = icon;
    if (parentId !== undefined) updateData.parentId = parentId === 'null' ? null : parentId;
    if (isShared !== undefined) updateData.isShared = isShared;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    
    // Update folder
    const updatedFolder = await Folder.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      folder: updatedFolder
    });
  } catch (error) {
    console.error('Update folder error:', error);
    res.status(500).json({ message: 'Server error during folder update' });
  }
});

// @route   DELETE /api/folders/:id
// @desc    Delete a folder
// @access  Private
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);
    
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }
    
    // Check if user is owner
    if (folder.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this folder' });
    }
    
    // Check if it's the default folder
    if (folder.isDefault) {
      return res.status(400).json({ message: 'Cannot delete the default folder' });
    }
    
    // Get all subfolders recursively
    const getAllSubfolderIds = async (folderId) => {
      const subfolders = await Folder.find({ parentId: folderId });
      let ids = [folderId];
      
      for (const subfolder of subfolders) {
        const subIds = await getAllSubfolderIds(subfolder._id);
        ids = [...ids, ...subIds];
      }
      
      return ids;
    };
    
    const folderIds = await getAllSubfolderIds(folder._id);
    
    // Find default folder for user
    const defaultFolder = await Folder.findOne({ userId: req.user.id, isDefault: true });
    
    if (!defaultFolder) {
      return res.status(500).json({ message: 'Default folder not found' });
    }
    
    // Move all boards to default folder
    await Board.updateMany(
      { folderId: { $in: folderIds } },
      { $set: { folderId: defaultFolder._id } }
    );
    
    // Move all images to default folder
    await Image.updateMany(
      { folderId: { $in: folderIds } },
      { $set: { folderId: defaultFolder._id } }
    );
    
    // Delete all subfolders
    await Folder.deleteMany({ _id: { $in: folderIds.slice(1) } });
    
    // Delete the folder
    await folder.remove();
    
    res.json({
      success: true,
      message: 'Folder deleted successfully'
    });
  } catch (error) {
    console.error('Delete folder error:', error);
    res.status(500).json({ message: 'Server error during folder deletion' });
  }
});

// @route   POST /api/folders/:id/share
// @desc    Share a folder with another user
// @access  Private
router.post('/:id/share', authenticate, async (req, res) => {
  try {
    const { userId, permission } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    const folder = await Folder.findById(req.params.id);
    
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }
    
    // Check if user is owner
    if (folder.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to share this folder' });
    }
    
    // Check if user is already in shared list
    const existingShare = folder.sharedWith.find(
      share => share.userId.toString() === userId
    );
    
    if (existingShare) {
      return res.status(400).json({ message: 'Folder is already shared with this user' });
    }
    
    // Add user to shared list
    folder.isShared = true;
    folder.sharedWith.push({
      userId,
      permission: permission || 'read',
      addedAt: new Date()
    });
    
    await folder.save();
    
    res.json({
      success: true,
      folder
    });
  } catch (error) {
    console.error('Share folder error:', error);
    res.status(500).json({ message: 'Server error while sharing folder' });
  }
});

// @route   DELETE /api/folders/:id/share/:userId
// @desc    Remove share from a folder
// @access  Private
router.delete('/:id/share/:userId', authenticate, async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);
    
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }
    
    // Check if user is owner
    if (folder.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to modify sharing for this folder' });
    }
    
    // Remove user from shared list
    folder.sharedWith = folder.sharedWith.filter(
      share => share.userId.toString() !== req.params.userId
    );
    
    // If no more shares, set isShared to false
    if (folder.sharedWith.length === 0) {
      folder.isShared = false;
    }
    
    await folder.save();
    
    res.json({
      success: true,
      folder
    });
  } catch (error) {
    console.error('Remove share error:', error);
    res.status(500).json({ message: 'Server error while removing share' });
  }
});

module.exports = router; 