const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  cloudinaryUrl: {
    type: String,
    required: true
  },
  cloudinaryPublicId: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  width: Number,
  height: Number,
  aiDescription: {
    type: String,
    maxlength: 1000
  },
  aiCategory: {
    type: String,
    maxlength: 100
  },
  aiConfidence: {
    type: Number,
    min: 0,
    max: 1
  },
  isProcessed: {
    type: Boolean,
    default: false
  },
  processingError: String,
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  downloadCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient queries
imageSchema.index({ userId: 1, createdAt: -1 });
imageSchema.index({ aiCategory: 1 });
imageSchema.index({ isProcessed: 1 });

module.exports = mongoose.model('Image', imageSchema);