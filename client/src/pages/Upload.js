import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload as UploadIcon, Image as ImageIcon, CheckCircle, AlertCircle, X, Eye } from 'lucide-react';
import { api } from '../pages/api/api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';

const Upload = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const onDrop = useCallback(async (acceptedFiles) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'uploading',
      progress: 0
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
    setIsUploading(true);

    for (const uploadFile of newFiles) {
      try {
        setUploadedFiles(prev =>
          prev.map(f =>
            f.id === uploadFile.id ? { ...f, progress: 50 } : f
          )
        );

        const response = await api.uploadImage(uploadFile.file);

        setUploadedFiles(prev =>
          prev.map(f =>
            f.id === uploadFile.id
              ? { ...f, status: 'success', progress: 100, imageId: response.data.image._id, response: response }
              : f
          )
        );

        toast.success(`${uploadFile.file.name} uploaded successfully! AI analysis in progress...`);
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Upload failed';
        
        setUploadedFiles(prev =>
          prev.map(f =>
            f.id === uploadFile.id
              ? { ...f, status: 'error', progress: 0, error: errorMessage }
              : f
          )
        );

        toast.error(`Failed to upload ${uploadFile.file.name}: ${errorMessage}`);
      }
    }

    setIsUploading(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 10
  });

  const removeFile = (id) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const retryUpload = async (uploadFile) => {
    setUploadedFiles(prev =>
      prev.map(f =>
        f.id === uploadFile.id
          ? { ...f, status: 'uploading', progress: 0, error: undefined }
          : f
      )
    );

    try {
      setUploadedFiles(prev =>
        prev.map(f =>
          f.id === uploadFile.id ? { ...f, progress: 50 } : f
        )
      );

      const response = await api.uploadImage(uploadFile.file);

      setUploadedFiles(prev =>
        prev.map(f =>
          f.id === uploadFile.id
            ? { ...f, status: 'success', progress: 100, imageId: response.data.image._id, response: response }
            : f
        )
      );

      toast.success(`${uploadFile.file.name} uploaded successfully! AI analysis in progress...`);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Upload failed';
      
      setUploadedFiles(prev =>
        prev.map(f =>
          f.id === uploadFile.id
            ? { ...f, status: 'error', progress: 0, error: errorMessage }
            : f
        )
      );

      toast.error(`Failed to upload ${uploadFile.file.name}: ${errorMessage}`);
    }
  };

  const clearSuccessfulUploads = () => {
    setUploadedFiles(prev => prev.filter(f => f.status !== 'success'));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Images</h1>
            <p className="text-gray-600">
              Upload your images and let our AI analyze them automatically. Supported formats: JPEG, PNG, GIF, BMP, WebP (max 10MB each).
            </p>
          </div>
          {uploadedFiles.some(f => f.status === 'success') && (
            <button
              onClick={() => {
                router.push('/gallery?uploaded=true');
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Eye className="h-4 w-4" />
              <span>View in Gallery</span>
            </button>
          )}
        </div>
      </div>

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center space-y-4">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
            isDragActive ? 'bg-blue-100' : 'bg-gray-100'
          }`}>
            <UploadIcon className={`h-10 w-10 ${
              isDragActive ? 'text-blue-600' : 'text-gray-400'
            }`} />
          </div>
          
          {isDragActive ? (
            <div>
              <p className="text-xl font-medium text-blue-600">Drop your images here!</p>
              <p className="text-gray-500">We'll start processing them immediately</p>
            </div>
          ) : (
            <div>
              <p className="text-xl font-medium text-gray-700">
                Drag & drop images here, or click to select
              </p>
              <p className="text-gray-500">
                Select up to 10 images (max 10MB each)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Progress */}
      {uploadedFiles.length > 0 && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Upload Progress ({uploadedFiles.length} files)
            </h2>
            {uploadedFiles.some(f => f.status === 'success') && (
              <button
                onClick={clearSuccessfulUploads}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear successful uploads
              </button>
            )}
          </div>

          <div className="space-y-3">
            {uploadedFiles.map((uploadFile) => (
              <div
                key={uploadFile.id}
                className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    {uploadFile.status === 'success' && uploadFile.response ? (
                      <div className="w-12 h-12 rounded-lg overflow-hidden">
                        <img
                          src={uploadFile.response.data.image.cloudinaryUrl}
                          alt={uploadFile.file.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {uploadFile.file.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(uploadFile.file.size)}
                      </p>
                      {uploadFile.status === 'success' && uploadFile.response && (
                        <p className="text-xs text-green-600">
                          AI processing in progress...
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {uploadFile.status === 'uploading' && (
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadFile.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-500">{uploadFile.progress}%</span>
                      </div>
                    )}

                    {uploadFile.status === 'success' && (
                      <div className="flex items-center space-x-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">Uploaded</span>
                      </div>
                    )}

                    {uploadFile.status === 'error' && (
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <span className="text-sm text-red-600">{uploadFile.error}</span>
                        <button
                          onClick={() => retryUpload(uploadFile)}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Retry
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => removeFile(uploadFile.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Information Section */}
      <div className="mt-12 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">What happens after upload?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <UploadIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Secure Storage</h4>
            <p className="text-sm text-gray-600">
              Your images are securely stored in the cloud with Cloudinary
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <ImageIcon className="h-6 w-6 text-purple-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">AI Analysis</h4>
            <p className="text-sm text-gray-600">
              Advanced AI analyzes your images for descriptions and categories
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Ready to Browse</h4>
            <p className="text-sm text-gray-600">
              View your organized gallery with smart tags and categories
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;