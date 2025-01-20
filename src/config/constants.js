// Environment variables
export const ENV = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws'
}

// File upload configuration
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_FILE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  UPLOAD_BUCKET: 'files',
  CHUNK_SIZE: 5 * 1024 * 1024 // 5MB chunks for large files
}

// Authentication configuration
export const AUTH_CONFIG = {
  REDIRECT_URL: window.location.origin,
  SESSION_EXPIRY: 3600, // 1 hour
  REFRESH_THRESHOLD: 300, // Refresh token if less than 5 minutes remaining
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  TOKEN_KEY: 'supabase.auth.token',
  REFRESH_TOKEN_KEY: 'supabase.auth.refresh_token'
}

// API configuration
export const API_CONFIG = {
  TIMEOUT: 10000, // 10 seconds
  ENDPOINTS: {
    AUTH: {
      SIGN_IN: '/auth/signin',
      SIGN_UP: '/auth/signup',
      SIGN_OUT: '/auth/signout',
      REFRESH: '/auth/refresh'
    },
    STORAGE: {
      UPLOAD: '/storage/upload',
      DOWNLOAD: '/storage/download',
      LIST: '/storage/list',
      DELETE: '/storage/delete'
    }
  }
}

// Upload states
export const UPLOAD_STATES = {
  IDLE: 'idle',
  VALIDATING: 'validating',
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  SUCCESS: 'success',
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
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: true,
    REQUIRE_UPPERCASE: true
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  }
}

// UI constants
export const UI = {
  ANIMATION_DURATION: 200,
  TOAST_DURATION: 5000,
  ERROR_DISPLAY_DURATION: 5000,
  SUCCESS_DISPLAY_DURATION: 3000,
  DEBOUNCE_DELAY: 300,
  BUTTON_STATES: {
    IDLE: 'idle',
    LOADING: 'loading',
    SUCCESS: 'success',
    ERROR: 'error'
  }
}

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_SETTINGS: 'user_settings',
  THEME: 'theme',
  LANGUAGE: 'language'
}

// Performance metrics
export const METRICS = {
  SLOW_THRESHOLD: 2000, // 2 seconds
  MAX_RETRY_TIME: 10000, // 10 seconds
  CACHE_TTL: 3600, // 1 hour
  MAX_BATCH_SIZE: 100
}

// WebSocket events
export const WS_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  RECONNECT: 'reconnect',
  FILE_UPDATED: 'file_updated',
  FILE_DELETED: 'file_deleted',
  AUTH_STATE_CHANGE: 'auth_state_change'
}

// Feature flags
export const FEATURES = {
  GOOGLE_AUTH: true,
  FILE_PREVIEW: true,
  DRAG_DROP: true,
  CHUNKED_UPLOAD: true,
  REAL_TIME_UPDATES: true
} 