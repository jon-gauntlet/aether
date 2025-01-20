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
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Error type helpers
export const isNetworkError = (error) => {
  return (
    error.message?.includes('fetch') ||
    error.message?.includes('network') ||
    error.message?.includes('Failed to fetch') ||
    error.message?.includes('NetworkError')
  )
}

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

export const isStorageError = (error) => {
  return (
    error.message?.includes('storage') ||
    error.message?.includes('bucket') ||
    error.message?.includes('upload') ||
    error.message?.includes('download')
  )
}

// Auth helpers
export const signInWithEmail = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  if (error) throw error
  return data
}

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google'
  })
  if (error) throw error
  return data
}

export const signUp = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  })
  if (error) throw error
  return data
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Session helpers
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  return session
}

export const refreshSession = async () => {
  const { data: { session }, error } = await supabase.auth.refreshSession()
  if (error) throw error
  return session
}

// Storage helpers
export const uploadFile = async (bucket, path, file) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file)
  if (error) throw error
  return data
}

export const downloadFile = async (bucket, path) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .download(path)
  if (error) throw error
  return data
}

export const removeFile = async (bucket, path) => {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path])
  if (error) throw error
}

export const listFiles = async (bucket, path = '') => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(path)
  if (error) throw error
  return data
} 