const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Debug: Check if environment variables are loaded
console.log('Cloudinary Config Check:');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Missing');
console.log('API Key:', process.env.CLOUDINARY_API_KEY ? 'Set' : 'Missing');
console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Missing');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME||dtdfmnfr1,
  api_key: process.env.CLOUDINARY_API_KEY ||417269152263274,
  api_secret: process.env.CLOUDINARY_API_SECRET ||s3SpVKlxV-rvK9XmGLhJKNWD0iE,
});

class CloudinaryService {
  async uploadImage(buffer, options = {}) {
    try {
      // Validate configuration
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        throw new Error('Cloudinary configuration is incomplete. Please check your .env file.');
      }

      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            ...options
          },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload stream error:', error);
              reject(error);
            } else {
              resolve(result);
            }
          }
        );

        uploadStream.end(buffer);
      });
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error(`Failed to upload image to Cloudinary: ${error.message}`);
    }
  }

  async deleteImage(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      throw new Error('Failed to delete image from Cloudinary');
    }
  }

  async getImageInfo(publicId) {
    try {
      const result = await cloudinary.api.resource(publicId);
      return result;
    } catch (error) {
      console.error('Cloudinary info error:', error);
      throw new Error('Failed to get image info from Cloudinary');
    }
  }

  generateTransformedUrl(publicId, transformations = {}) {
    return cloudinary.url(publicId, {
      ...transformations,
      secure: true
    });
  }
}

module.exports = new CloudinaryService();