const express = require('express');
const multer = require('multer');
const { authMiddleware } = require('../middleware/auth');
const cloudinaryService = require('../services/cloudinaryService');
const aiService = require('../services/aiService');
const queueService = require('../services/queueService');
const Image = require('../model.js/Image');
const User = require('../model.js/User');

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Upload image
router.post('/upload', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const { originalname, buffer, size, mimetype } = req.file;

    // Upload to Cloudinary
    const cloudinaryResult = await cloudinaryService.uploadImage(buffer, {
      folder: 'ai-image-app'
    });

    // Create image record
    const image = new Image({
      userId: req.user._id,
      originalName: originalname,
      cloudinaryUrl: cloudinaryResult.secure_url,
      cloudinaryPublicId: cloudinaryResult.public_id,
      size,
      mimeType: mimetype,
      width: cloudinaryResult.width,
      height: cloudinaryResult.height
    });

    await image.save();

    // Add to processing queue
    await queueService.addToQueue(image._id, 'ai_processing', {
      imageUrl: cloudinaryResult.secure_url
    });

    // Update user upload count
    await User.findByIdAndUpdate(req.user._id, { $inc: { uploadCount: 1 } });

    res.status(201).json({
      message: 'Image uploaded successfully',
      image: image
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      message: 'Failed to upload image',
      error: error.message 
    });
  }
});

// Get user's images
router.get('/my-images', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const images = await Image.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email');

    const total = await Image.countDocuments({ userId: req.user._id });

    res.json({
      images,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get images error:', error);
    res.status(500).json({ message: 'Failed to fetch images' });
  }
});

// Get single image
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const image = await Image.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('userId', 'name email');

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    res.json({ image });
  } catch (error) {
    console.error('Get image error:', error);
    res.status(500).json({ message: 'Failed to fetch image' });
  }
});

// Delete image
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const image = await Image.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Delete from Cloudinary
    await cloudinaryService.deleteImage(image.cloudinaryPublicId);

    // Delete from database
    await Image.findByIdAndDelete(req.params.id);

    // Update user upload count
    await User.findByIdAndUpdate(req.user._id, { $inc: { uploadCount: -1 } });

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ message: 'Failed to delete image' });
  }
});

// Retry AI processing
router.post('/:id/retry-processing', authMiddleware, async (req, res) => {
  try {
    const image = await Image.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Add back to processing queue
    await queueService.addToQueue(image._id, 'ai_processing', {
      imageUrl: image.cloudinaryUrl
    });

    res.json({ message: 'Image added to processing queue' });
  } catch (error) {
    console.error('Retry processing error:', error);
    res.status(500).json({ message: 'Failed to retry processing' });
  }
});

// Get processing stats
router.get('/stats/processing', authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const stats = await Image.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          processed: { $sum: { $cond: ['$isProcessed', 1, 0] } },
          pending: { $sum: { $cond: ['$isProcessed', 0, 1] } }
        }
      }
    ]);

    const result = stats[0] || { total: 0, processed: 0, pending: 0 };

    res.json(result);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

module.exports = router;