import { createClient } from '@supabase/supabase-js'

// Environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
if (!SUPABASE_URL) {
  throw new Error('Missing environment variable: VITE_SUPABASE_URL')
}
if (!SUPABASE_ANON_KEY) {
  throw new Error('Missing environment variable: VITE_SUPABASE_ANON_KEY')
}

// Create Supabase client with options
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'supabase.auth.token',
    flowType: 'pkce'
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-application-name': 'auth-files'
    }
  }
})

// Helper to check if error is network related
export const isNetworkError = (error) => {
  return (
    error.message?.includes('fetch') ||
    error.message?.includes('network') ||
    error.message?.includes('Failed to fetch') ||
    error.message?.includes('NetworkError')
  )
}

// Helper to check if error is auth related
export const isAuthError = (error) => {
  return (
    error.message?.includes('auth') ||
    error.message?.includes('login') ||
    error.message?.includes('JWT') ||
    error.message?.includes('token') ||
    error.status === 401 ||
    error.status === 403
  )
}

// Helper to check if error is storage related
export const isStorageError = (error) => {
  return (
    error.message?.includes('storage') ||
    error.message?.includes('bucket') ||
    error.message?.includes('upload') ||
    error.message?.includes('download') ||
    error.status === 413 // Payload too large
  )
}

// Helper to get user-friendly error message
export const getErrorMessage = (error) => {
  if (isNetworkError(error)) {
    return 'Unable to connect. Please check your internet connection.'
  }
  if (isAuthError(error)) {
    if (error.message?.includes('expired')) {
      return 'Your session has expired. Please sign in again.'
    }
    if (error.message?.includes('invalid')) {
      return 'Invalid email or password.'
    }
    return 'Authentication error. Please sign in again.'
  }
  if (isStorageError(error)) {
    if (error.status === 413) {
      return 'File is too large to upload.'
    }
    if (error.message?.includes('not found')) {
      return 'File or folder not found.'
    }
    return 'Storage error. Please try again.'
  }
  return error.message || 'An unexpected error occurred.'
}

export default supabase 