import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { api } from '../pages/api/api';
import ImageCard from '../components/ImageCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { Search, Filter, Upload, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const Gallery = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const router = useRouter();

  useEffect(() => {
    fetchImages();
  }, [pagination.page]);

  useEffect(() => {
    // Show success message if coming from upload
    if (router.query.uploaded === 'true') {
      toast.success('Images uploaded successfully! AI analysis is in progress.');
      // Remove the query parameter
      router.replace('/gallery', undefined, { shallow: true });
    }
  }, [router.query.uploaded]);

  useEffect(() => {
    extractCategories();
  }, [images]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const response = await api.getUserImages(pagination.page, pagination.limit);
      setImages(response.data.images);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Failed to fetch images');
      console.error('Fetch images error:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractCategories = () => {
    const uniqueCategories = Array.from(
      new Set(images.filter(img => img.aiCategory).map(img => img.aiCategory))
    );
    setCategories(uniqueCategories.sort());
  };

  const handleImageDelete = (imageId) => {
    setImages(prev => prev.filter(img => img._id !== imageId));
    setPagination(prev => ({ ...prev, total: prev.total - 1 }));
  };

  const handleRetryProcessing = async (imageId) => {
    // Refresh the specific image or the entire list
    setTimeout(() => {
      fetchImages();
    }, 1000);
  };

  const filteredImages = images.filter(image => {
    const matchesSearch = searchTerm === '' || 
      image.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      image.aiDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      image.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === '' || image.aiCategory === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  if (loading && images.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <LoadingSpinner size="lg" text="Loading your gallery..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Gallery</h1>
            <p className="text-gray-600">
              {pagination.total} image{pagination.total !== 1 ? 's' : ''} in your collection
            </p>
          </div>
          <div className="flex space-x-3 mt-4 sm:mt-0">
            <button
              onClick={fetchImages}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => router.push('/upload')}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload className="h-4 w-4" />
              <span>Upload More</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search images, descriptions, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {images.length === 0 && !loading && (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No images yet</h3>
          <p className="text-gray-600 mb-6">Start building your AI-powered gallery by uploading your first image.</p>
          <button
            onClick={() => router.push('/upload')}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload className="h-5 w-5" />
            <span>Upload Your First Image</span>
          </button>
        </div>
      )}

      {/* Gallery Grid */}
      {filteredImages.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {filteredImages.map((image) => (
              <ImageCard
                key={image._id}
                image={image}
                onDelete={handleImageDelete}
                onRetry={handleRetryProcessing}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  let pageNum;
                  if (pagination.pages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.pages - 2) {
                    pageNum = pagination.pages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 border rounded-md ${
                        pageNum === pagination.page
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* No Search Results */}
      {filteredImages.length === 0 && images.length > 0 && (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No images found</h3>
          <p className="text-gray-600 mb-6">
            Try adjusting your search terms or category filter.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('');
            }}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
};

export default Gallery;