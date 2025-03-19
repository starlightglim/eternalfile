const mongoose = require('mongoose');

const BoardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please provide a board title'],
    trim: true,
    maxlength: [100, 'Board title cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  background: {
    type: String,
    enum: ['white', 'grid', 'dots', 'lines', 'custom'],
    default: 'white'
  },
  customBackground: {
    type: String,
    default: ''
  },
  collaborators: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['viewer', 'editor', 'admin'],
      default: 'viewer'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  viewCount: {
    type: Number,
    default: 0
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  settings: {
    allowComments: {
      type: Boolean,
      default: true
    },
    gridSize: {
      type: Number,
      default: 20
    },
    snapToGrid: {
      type: Boolean,
      default: false
    }
  },
  folderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  }
}, { timestamps: true });

// Virtual for images
BoardSchema.virtual('images', {
  ref: 'Image',
  localField: '_id',
  foreignField: 'boardId'
});

// Update lastActivity on save
BoardSchema.pre('save', function(next) {
  this.lastActivity = new Date();
  next();
});

// Set virtuals to true when converting to JSON
BoardSchema.set('toJSON', { virtuals: true });
BoardSchema.set('toObject', { virtuals: true });

// Index for faster queries
BoardSchema.index({ userId: 1 });
BoardSchema.index({ isPublic: 1 });
BoardSchema.index({ tags: 1 });

module.exports = mongoose.model('Board', BoardSchema); 