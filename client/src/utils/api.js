import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Property API calls
export const propertyAPI = {
  getAll: (params) => api.get('/properties', { params }),
  getById: (id) => api.get(`/properties/${id}`),
  create: (data) => api.post('/properties', data),
  update: (id, data) => api.put(`/properties/${id}`, data),
  delete: (id) => api.delete(`/properties/${id}`),
  getAvailability: (id) => api.get(`/properties/${id}/availability`),
};

// Auth API calls
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

// Booking API calls
export const bookingAPI = {
  create: (data) => api.post('/bookings', data),
  getMyBookings: () => api.get('/bookings/my-bookings'),
  getAll: () => api.get('/bookings'),
  updateStatus: (id, status) => api.put(`/bookings/${id}/status`, { status }),
  update: (id, data) => api.put(`/bookings/${id}`, data),
  cancel: (id) => api.put(`/bookings/${id}/cancel`),
};

// Upload API calls
export const uploadAPI = {
  uploadSingle: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await axios.post(`${API_BASE_URL}/upload/single`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response;
  },
  uploadMultiple: async (files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    const response = await axios.post(`${API_BASE_URL}/upload/multiple`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response;
  }
};

export default api;