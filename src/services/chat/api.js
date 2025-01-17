import axios from 'axios';
import { createErrorFromResponse } from '../../utils/errors';
import config from '../../config';
import { getAuthToken, refreshAuthToken } from '../supabase';

export const api = axios.create({
  baseURL: config.api.baseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
api.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(createErrorFromResponse(error))
);

// Add response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const appError = createErrorFromResponse(error);
    
    // Handle unauthorized access
    if (appError.code === 'UNAUTHORIZED') {
      try {
        // Attempt to refresh the token
        const newToken = await refreshAuthToken();
        if (newToken && error.config) {
          // Retry the original request with the new token
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return api.request(error.config);
        }
      } catch (refreshError) {
        // If refresh fails, redirect to login
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(appError);
  }
); 