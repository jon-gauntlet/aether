import axios from 'axios';
import { createErrorFromResponse } from '../../utils/errors';

export const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication if needed
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(createErrorFromResponse(error))
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const appError = createErrorFromResponse(error);
    
    // Handle unauthorized access
    if (appError.code === 'UNAUTHORIZED') {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    
    return Promise.reject(appError);
  }
); 