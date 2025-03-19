const mongoose = require('mongoose');

const FolderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please provide a folder name'],
    trim: true,
    maxlength: [50, 'Folder name cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters'],
    default: ''
  },
  color: {
    type: String,
    default: '#CCCCCC'
  },
  icon: {
    type: String,
    default: 'folder'
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },
  isShared: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['read', 'write'],
      default: 'read'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isDefault: {
    type: Boolean,
    default: false
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Virtual for boards in this folder
FolderSchema.virtual('boards', {
  ref: 'Board',
  localField: '_id',
  foreignField: 'folderId'
});

// Virtual for images in this folder
FolderSchema.virtual('images', {
  ref: 'Image',
  localField: '_id',
  foreignField: 'folderId'
});

// Virtual for subfolders
FolderSchema.virtual('subfolders', {
  ref: 'Folder',
  localField: '_id',
  foreignField: 'parentId'
});

// Set virtuals to true when converting to JSON
FolderSchema.set('toJSON', { virtuals: true });
FolderSchema.set('toObject', { virtuals: true });

// Index for faster queries
FolderSchema.index({ userId: 1 });
FolderSchema.index({ parentId: 1 });

// Pre-save hook to ensure default folder is unique per user
FolderSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    try {
      // If this folder is being set as default, unset any other default folders for this user
      await this.constructor.updateMany(
        { userId: this.userId, _id: { $ne: this._id }, isDefault: true },
        { isDefault: false }
      );
    } catch (error) {
      next(error);
    }
  }
  next();
});

module.exports = mongoose.model('Folder', FolderSchema); 