import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Only access localStorage on client side
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token) {
    this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  clearAuthToken() {
    delete this.api.defaults.headers.common['Authorization'];
  }

  // Auth endpoints
  async login(email, password) {
    return this.api.post('/auth/login', { email, password });
  }

  async register(email, password, name) {
    return this.api.post('/auth/register', { email, password, name });
  }

  async getCurrentUser() {
    return this.api.get('/auth/me');
  }

  async logout() {
    return this.api.post('/auth/logout');
  }

  // Image endpoints
  async uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    
    return this.api.post('/images/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async getUserImages(page = 1, limit = 12) {
    return this.api.get(`/images/my-images?page=${page}&limit=${limit}`);
  }

  async getImage(id) {
    return this.api.get(`/images/${id}`);
  }

  async deleteImage(id) {
    return this.api.delete(`/images/${id}`);
  }

  async retryProcessing(id) {
    return this.api.post(`/images/${id}/retry-processing`);
  }

  async getProcessingStats() {
    return this.api.get('/images/stats/processing');
  }

  // Health check
  async healthCheck() {
    return this.api.get('/health');
  }
}

export const api = new ApiService();