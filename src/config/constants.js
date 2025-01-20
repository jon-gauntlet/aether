// Environment variables with defaults
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// File upload configuration
export const MAX_FILE_SIZE = parseInt(import.meta.env.VITE_MAX_FILE_SIZE || '5242880', 10) // 5MB default
export const ALLOWED_FILE_TYPES = (import.meta.env.VITE_ALLOWED_FILE_TYPES || 'image/*,application/pdf,.doc,.docx').split(',')
export const UPLOAD_BUCKET = import.meta.env.VITE_UPLOAD_BUCKET || 'files'

// Auth configuration
export const AUTH_REDIRECT_URL = import.meta.env.VITE_AUTH_REDIRECT_URL || 'http://localhost:5173/auth/callback'
export const SESSION_EXPIRY = parseInt(import.meta.env.VITE_SESSION_EXPIRY || '3600', 10) // 1 hour default
export const REFRESH_INTERVAL = parseInt(import.meta.env.VITE_REFRESH_INTERVAL || '240', 10) // 4 minutes default

// API configuration
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
export const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10) // 30 seconds default

// File upload states
export const UPLOAD_STATES = {
  IDLE: 'idle',
  UPLOADING: 'uploading',
  SUCCESS: 'success',
  ERROR: 'error',
  CANCELLED: 'cancelled'
}

// Auth states
export const AUTH_STATES = {
  INITIAL: 'initial',
  LOADING: 'loading',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
  ERROR: 'error'
}

// Error types
export const ERROR_TYPES = {
  NETWORK: 'network',
  AUTH: 'auth',
  STORAGE: 'storage',
  VALIDATION: 'validation',
  UNKNOWN: 'unknown'
}

// Validation rules
export const VALIDATION = {
  email: {
    required: 'Email is required',
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: 'Invalid email address'
    }
  },
  password: {
    required: 'Password is required',
    minLength: {
      value: 6,
      message: 'Password must be at least 6 characters'
    }
  },
  file: {
    maxSize: {
      value: MAX_FILE_SIZE,
      message: `File size must not exceed ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    },
    allowedTypes: {
      value: ALLOWED_FILE_TYPES,
      message: `Allowed file types: ${ALLOWED_FILE_TYPES.join(', ')}`
    }
  }
}

// UI Constants
export const UI = {
  animations: {
    duration: 200,
    easing: 'ease-in-out'
  },
  toast: {
    duration: 5000,
    position: 'top-right'
  },
  dropzone: {
    accept: ALLOWED_FILE_TYPES.join(','),
    maxSize: MAX_FILE_SIZE,
    multiple: true
  }
}

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'supabase.auth.token',
  THEME: 'theme',
  LANGUAGE: 'language'
}

// API Endpoints
export const ENDPOINTS = {
  auth: {
    signIn: '/auth/sign-in',
    signUp: '/auth/sign-up',
    signOut: '/auth/sign-out',
    resetPassword: '/auth/reset-password',
    updatePassword: '/auth/update-password'
  },
  storage: {
    upload: '/storage/upload',
    download: '/storage/download',
    list: '/storage/list',
    delete: '/storage/delete'
  }
}

// Performance metrics
export const PERFORMANCE = {
  uploadConcurrency: 3, // Number of concurrent uploads
  chunkSize: 1024 * 1024, // 1MB chunk size for large file uploads
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  sessionCheckInterval: REFRESH_INTERVAL * 1000, // Convert to milliseconds
  debounceDelay: 300 // 300ms debounce delay for search/filter
} 