const cron = require('node-cron');
const Queue = require('../model.js/Queue');
const Image = require('../model.js/Image');
const aiService = require('./aiService');

class QueueService {
  constructor() {
    this.isProcessing = false;
    this.processingInterval = null;
  }

  async addToQueue(imageId, type = 'ai_processing', data = {}) {
    try {
      const queueItem = new Queue({
        imageId,
        type,
        data
      });

      await queueItem.save();
      console.log(`Added to queue: ${imageId} (${type})`);
      return queueItem;
    } catch (error) {
      console.error('Queue add error:', error);
      throw error;
    }
  }

  async processQueue() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      // Get pending items
      const pendingItems = await Queue.find({
        status: 'pending',
        attempts: { $lt: 3 }
      })
      .sort({ createdAt: 1 })
      .limit(5);

      console.log(`Processing ${pendingItems.length} queue items`);

      for (const item of pendingItems) {
        await this.processQueueItem(item);
      }

      // Clean up completed items older than 24 hours
      await Queue.deleteMany({
        status: 'completed',
        processedAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

    } catch (error) {
      console.error('Queue processing error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  async processQueueItem(queueItem) {
    try {
      // Update status to processing
      await Queue.findByIdAndUpdate(queueItem._id, {
        status: 'processing',
        $inc: { attempts: 1 }
      });

      const image = await Image.findById(queueItem.imageId);
      if (!image) {
        await Queue.findByIdAndUpdate(queueItem._id, {
          status: 'failed',
          lastError: 'Image not found'
        });
        return;
      }

      if (queueItem.type === 'ai_processing') {
        await this.processAIAnalysis(queueItem, image);
      }

    } catch (error) {
      console.error(`Queue item processing error (${queueItem._id}):`, error);

      await Queue.findByIdAndUpdate(queueItem._id, {
        status: queueItem.attempts >= queueItem.maxAttempts ? 'failed' : 'pending',
        lastError: error.message
      });
    }
  }

  async processAIAnalysis(queueItem, image) {
    try {
      console.log(`Processing AI analysis for image: ${image._id}`);

      // Perform AI analysis
      const analysis = await aiService.analyzeImage(image.cloudinaryUrl);

      // Update image with AI results
      await Image.findByIdAndUpdate(image._id, {
        aiDescription: analysis.description,
        aiCategory: analysis.category,
        aiConfidence: analysis.confidence,
        tags: analysis.tags,
        isProcessed: true
      });

      // Mark queue item as completed
      await Queue.findByIdAndUpdate(queueItem._id, {
        status: 'completed',
        processedAt: new Date()
      });

      console.log(`Completed AI analysis for image: ${image._id}`);

    } catch (error) {
      console.error(`AI processing error for image ${image._id}:`, error);
      throw error;
    }
  }

  startQueueProcessor() {
    console.log('Starting queue processor...');

    // Process queue every 30 seconds
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 30000);

    // Also schedule with cron for reliability (every minute)
    cron.schedule('* * * * *', () => {
      this.processQueue();
    });

    // Initial processing
    setTimeout(() => {
      this.processQueue();
    }, 5000);
  }

  stopQueueProcessor() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    console.log('Queue processor stopped');
  }

  async getQueueStats() {
    try {
      const stats = await Queue.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const result = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0
      };

      stats.forEach(stat => {
        result[stat._id] = stat.count;
      });

      return result;
    } catch (error) {
      console.error('Queue stats error:', error);
      return { pending: 0, processing: 0, completed: 0, failed: 0 };
    }
  }
}

module.exports = new QueueService();