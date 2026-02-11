import axios from 'axios';
import { getIdToken } from './firebase';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
const FINAL_API_URL = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

const api = axios.create({
  baseURL: FINAL_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await getIdToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  getMe: () => api.get('/auth/me'),
  updateMe: (data: { displayName?: string; photoURL?: string }) =>
    api.put('/auth/me', data),
};

// Restaurant API
export const restaurantAPI = {
  create: (data: any) => api.post('/restaurants', data),
  getMy: () => api.get('/restaurants/my'),
  getById: (id: string) => api.get(`/restaurants/${id}`),
  update: (id: string, data: any) => api.put(`/restaurants/${id}`, data),
  delete: (id: string) => api.delete(`/restaurants/${id}`),
  getQR: (id: string) => api.get(`/restaurants/${id}/qr`),
  regenerateQR: (id: string) => api.post(`/restaurants/${id}/qr/regenerate`),
};

// Category API
export const categoryAPI = {
  getAll: (restaurantId: string) => api.get(`/categories/${restaurantId}`),
  create: (data: any) => api.post('/categories', data),
  update: (id: string, data: any) => api.put(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
  reorder: (data: { restaurant: string; categoryIds: string[] }) =>
    api.patch('/categories/reorder', data),
};

// Menu API
export const menuAPI = {
  getAll: (restaurantId: string, params?: any) =>
    api.get(`/menu/${restaurantId}`, { params }),
  getById: (id: string) => api.get(`/menu/item/${id}`),
  create: (data: any) => api.post('/menu', data),
  update: (id: string, data: any) => api.put(`/menu/${id}`, data),
  delete: (id: string) => api.delete(`/menu/${id}`),
  toggle: (id: string) => api.patch(`/menu/${id}/toggle`),
};

// Subscription API
export const subscriptionAPI = {
  getStatus: () => api.get('/subscription/status'),
  createCheckout: (plan: string) =>
    api.post('/subscription/create-checkout', { plan }),
  cancel: () => api.post('/subscription/cancel'),
  getHistory: () => api.get('/subscription/history'),
};

// Public API (no auth required)
export const publicAPI = {
  getRestaurant: (slug: string) => api.get(`/public/restaurant/${slug}`),
  getMenu: (slug: string) => api.get(`/public/menu/${slug}`),
  recordScan: (slug: string) => api.post(`/public/menu/${slug}/scan`),
};

// Admin API
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getAnalytics: (period?: number) => api.get('/admin/analytics', { params: { period } }),
  getUsers: (params?: { page?: number; limit?: number; search?: string; role?: string }) =>
    api.get('/admin/users', { params }),
  getUserDetails: (id: string) => api.get(`/admin/users/${id}`),
  updateUserRole: (id: string, role: string) =>
    api.patch(`/admin/users/${id}/role`, { role }),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  getRestaurants: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
    api.get('/admin/restaurants', { params }),
  toggleRestaurant: (id: string) => api.patch(`/admin/restaurants/${id}/toggle`),
  deleteRestaurant: (id: string) => api.delete(`/admin/restaurants/${id}`),
};

// Upload API
export const uploadAPI = {
  uploadImage: async (file: File, folder?: string) => {
    const formData = new FormData();
    formData.append('image', file);
    if (folder) formData.append('folder', folder);
    return api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadLogo: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadMenuItem: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload/menu-item', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// Feedback API
export const feedbackAPI = {
  create: (data: { type: string; subject: string; message: string; email: string; name?: string; priority?: string }) =>
    api.post('/feedback', data),
  getAll: (params?: { page?: number; limit?: number; status?: string; type?: string }) =>
    api.get('/feedback/admin', { params }),
  updateStatus: (id: string, data: { status: string; adminNotes?: string }) =>
    api.patch(`/feedback/admin/${id}`, data),
  delete: (id: string) => api.delete(`/feedback/admin/${id}`),
};

// Customer Feedback API
export const customerFeedbackAPI = {
  submit: (data: { restaurantId: string; rating: number; comment?: string; customerName?: string; customerPhone?: string }) =>
    api.post('/public/feedback', data),
  getRestaurantFeedback: (restaurantId: string, params?: { page?: number; limit?: number; rating?: number }) =>
    api.get(`/restaurants/${restaurantId}/feedback`, { params }),
};

export default api;
