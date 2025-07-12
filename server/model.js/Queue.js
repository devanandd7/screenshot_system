const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema({
  imageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Image',
    required: true
  },
  type: {
    type: String,
    enum: ['ai_processing', 'thumbnail_generation'],
    default: 'ai_processing'
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  attempts: {
    type: Number,
    default: 0
  },
  maxAttempts: {
    type: Number,
    default: 3
  },
  lastError: String,
  processedAt: Date,
  data: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index for efficient queue processing
queueSchema.index({ status: 1, type: 1, attempts: 1 });
queueSchema.index({ createdAt: 1 });

module.exports = mongoose.model('Queue', queueSchema);