import React, { useState } from 'react';
import { Trash2, Download, RefreshCw, Eye, Calendar, Tag } from 'lucide-react';
import { api } from '../pages/api/api';
import toast from 'react-hot-toast';

const ImageCard = ({ image, onDelete, onRetry }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleDelete = async () => {
    // Only use confirm on client side
    if (typeof window !== 'undefined' && !confirm('Are you sure you want to delete this image?')) return;
    
    setIsDeleting(true);
    try {
      await api.deleteImage(image._id);
      onDelete(image._id);
      toast.success('Image deleted successfully');
    } catch (error) {
      toast.error('Failed to delete image');
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await api.retryProcessing(image._id);
      onRetry(image._id);
      toast.success('Image added to processing queue');
    } catch (error) {
      toast.error('Failed to retry processing');
      console.error('Retry error:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
        <div className="aspect-square relative overflow-hidden group">
          <img
            src={image.cloudinaryUrl}
            alt={image.originalName}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
            <button
              onClick={() => setShowModal(true)}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white rounded-full p-2 hover:bg-gray-100"
            >
              <Eye className="h-5 w-5 text-gray-700" />
            </button>
          </div>
          {!image.isProcessed && (
            <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              Processing...
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-medium text-gray-900 mb-2 truncate">{image.originalName}</h3>
          
          {image.isProcessed && image.aiCategory && (
            <div className="flex items-center space-x-1 mb-2">
              <Tag className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-600 font-medium">{image.aiCategory}</span>
              {image.aiConfidence && (
                <span className="text-xs text-gray-500">
                  ({Math.round(image.aiConfidence * 100)}%)
                </span>
              )}
            </div>
          )}

          {image.aiDescription && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {image.aiDescription}
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(image.createdAt)}</span>
            </div>
            <span>{formatFileSize(image.size)}</span>
          </div>

          {image.tags && image.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {image.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs"
                >
                  {tag}
                </span>
              ))}
              {image.tags.length > 3 && (
                <span className="text-xs text-gray-500">+{image.tags.length - 3} more</span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {!image.isProcessed && onRetry && (
                <button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
                  title="Retry processing"
                >
                  <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
                </button>
              )}
              <a
                href={image.cloudinaryUrl}
                download={image.originalName}
                className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                title="Download"
              >
                <Download className="h-4 w-4" />
              </a>
            </div>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-gray-900">{image.originalName}</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <img
                src={image.cloudinaryUrl}
                alt={image.originalName}
                className="w-full max-h-96 object-contain rounded-lg mb-4"
              />
              
              <div className="space-y-3">
                {image.aiCategory && (
                  <div>
                    <span className="font-medium text-gray-700">Category: </span>
                    <span className="text-blue-600">{image.aiCategory}</span>
                    {image.aiConfidence && (
                      <span className="text-gray-500 text-sm">
                        {' '}({Math.round(image.aiConfidence * 100)}% confidence)
                      </span>
                    )}
                  </div>
                )}
                
                {image.aiDescription && (
                  <div>
                    <span className="font-medium text-gray-700">Description: </span>
                    <p className="text-gray-600 mt-1">{image.aiDescription}</p>
                  </div>
                )}
                
                {image.tags && image.tags.length > 0 && (
                  <div>
                    <span className="font-medium text-gray-700">Tags: </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {image.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="text-sm text-gray-500">
                  <p>Uploaded: {formatDate(image.createdAt)}</p>
                  <p>Size: {formatFileSize(image.size)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageCard;