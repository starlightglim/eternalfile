const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema({
  boardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  url: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String,
    required: true
  },
  // S3 specific fields
  s3Key: {
    type: String,
    default: null
  },
  thumbnailKey: {
    type: String,
    default: null
  },
  title: {
    type: String,
    trim: true,
    default: 'Untitled Image'
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  position: {
    x: {
      type: Number,
      default: 0
    },
    y: {
      type: Number,
      default: 0
    },
    width: {
      type: Number,
      default: 300
    },
    height: {
      type: Number,
      default: 200
    },
    zIndex: {
      type: Number,
      default: 1
    },
    rotation: {
      type: Number,
      default: 0
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
  isAIGenerated: {
    type: Boolean,
    default: false
  },
  parentImages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Image'
  }],
  metadata: {
    originalFilename: String,
    fileSize: Number,
    mimeType: String,
    dimensions: {
      width: Number,
      height: Number
    },
    exif: mongoose.Schema.Types.Mixed,
    generatedAt: Date,
    jobId: String,
    storageProvider: {
      type: String,
      enum: ['local', 's3', 'cloudinary'],
      default: 's3'
    }
  },
  folderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Folder',
    default: null
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Index for faster queries
ImageSchema.index({ boardId: 1 });
ImageSchema.index({ userId: 1 });
ImageSchema.index({ isAIGenerated: 1 });
ImageSchema.index({ folderId: 1 });
ImageSchema.index({ tags: 1 });
// Index for S3 keys
ImageSchema.index({ s3Key: 1 });
ImageSchema.index({ thumbnailKey: 1 });

// Method to update position
ImageSchema.methods.updatePosition = function(newPosition) {
  this.position = { ...this.position, ...newPosition };
  this.markModified('position');
  return this.save();
};

// Method to delete from S3
ImageSchema.methods.deleteFromS3 = async function() {
  const s3Service = require('../services/s3Service');
  
  try {
    if (this.s3Key) {
      await s3Service.deleteFile(this.s3Key);
    }
    
    if (this.thumbnailKey) {
      await s3Service.deleteFile(this.thumbnailKey);
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting image from S3:', error);
    throw error;
  }
};

// Pre-remove hook to delete file from S3 when image is deleted
ImageSchema.pre('remove', async function(next) {
  try {
    if (this.metadata.storageProvider === 's3') {
      await this.deleteFromS3();
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Image', ImageSchema); 