import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import PropTypes from 'prop-types'

const AuthContext = createContext(null)

const ERROR_MESSAGES = {
  NETWORK: 'Network error. Please check your connection.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  RATE_LIMIT: 'Too many attempts. Please try again later.',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
  DEFAULT: 'An error occurred. Please try again.'
}

const mapErrorMessage = (error) => {
  if (!error) return null
  if (!navigator.onLine) return ERROR_MESSAGES.NETWORK
  if (error.message?.includes('network')) return ERROR_MESSAGES.NETWORK
  if (error.message?.includes('credentials')) return ERROR_MESSAGES.INVALID_CREDENTIALS
  if (error.message?.includes('rate limit')) return ERROR_MESSAGES.RATE_LIMIT
  if (error.message?.includes('expired')) return ERROR_MESSAGES.SESSION_EXPIRED
  return ERROR_MESSAGES.DEFAULT
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ 
  children, 
  supabase: customSupabase,
  supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321',
  supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
  sessionPersistence = true,
  refreshInterval = 4 * 60 * 1000, // 4 minutes
  onAuthStateChange
}) => {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const mountedRef = useRef(true)
  const authSubscriptionRef = useRef(null)
  const refreshTimerRef = useRef(null)
  const errorTimeoutRef = useRef(null)
  const supabaseRef = useRef(null)
  const sessionCheckRef = useRef(null)

  const setSafeError = useCallback((error) => {
    if (!mountedRef.current) return
    const mappedError = mapErrorMessage(error)
    setError(mappedError)
    
    // Clear error after 5 seconds
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current)
    }
    if (mappedError) {
      errorTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setError(null)
        }
      }, 5000)
    }
  }, [])

  const clearError = useCallback(() => {
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current)
    }
    setError(null)
  }, [])

  // Initialize Supabase client only once with proper config
  if (!supabaseRef.current) {
    supabaseRef.current = customSupabase || createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: sessionPersistence,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: sessionPersistence ? window.localStorage : window.sessionStorage,
        storageKey: 'supabase.auth.token',
        flowType: 'pkce'
      }
    })
  }

  // Safely set state only if component is mounted
  const safeSetState = useCallback((setter) => {
    if (mountedRef.current) {
      setter()
    }
  }, [])

  // Periodic session check
  const startSessionCheck = useCallback(() => {
    if (sessionCheckRef.current) {
      clearInterval(sessionCheckRef.current)
    }

    sessionCheckRef.current = setInterval(async () => {
      if (!mountedRef.current) return

      try {
        const { data: { session: currentSession }, error } = await supabaseRef.current.auth.getSession()
        if (error) throw error

        if (mountedRef.current) {
          if (!currentSession && session) {
            // Session was invalidated
            safeSetState(() => {
              setSession(null)
              setSafeError('Session expired. Please sign in again.')
            })
          } else if (currentSession?.access_token !== session?.access_token) {
            // Session was updated externally
            safeSetState(() => {
              setSession(currentSession)
              setSafeError(null)
            })
          }
        }
      } catch (e) {
        if (mountedRef.current) {
          setSafeError(e)
        }
      }
    }, refreshInterval)

    return () => {
      if (sessionCheckRef.current) {
        clearInterval(sessionCheckRef.current)
      }
    }
  }, [session, refreshInterval, setSafeError])

  // Setup token refresh with exponential backoff and retry
  const setupTokenRefresh = useCallback((session) => {
    if (!session?.expires_at) return

    const expiresAt = new Date(session.expires_at * 1000)
    const now = new Date()
    const timeUntilExpiry = expiresAt.getTime() - now.getTime()
    const refreshBuffer = Math.min(timeUntilExpiry * 0.1, 60000) // 10% of time until expiry or 1 minute
    const maxRetries = 3
    let retryCount = 0
    let backoffDelay = 1000 // Start with 1 second

    const attemptRefresh = async () => {
      try {
        const { data, error } = await supabaseRef.current.auth.refreshSession()
        if (error) throw error

        if (mountedRef.current) {
          safeSetState(() => {
            setSession(data.session)
            setSafeError(null)
          })

          if (data.session) {
            setupTokenRefresh(data.session)
          }
        }
      } catch (e) {
        if (!mountedRef.current) return

        retryCount++
        if (retryCount < maxRetries) {
          // Exponential backoff
          backoffDelay *= 2
          refreshTimerRef.current = setTimeout(attemptRefresh, backoffDelay)
        } else {
          safeSetState(() => {
            setSafeError(e)
            setSession(null)
          })
        }
      }
    }

    // Clear existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
    }

    // Set new timer if token will expire
    if (timeUntilExpiry > 0) {
      refreshTimerRef.current = setTimeout(attemptRefresh, timeUntilExpiry - refreshBuffer)
    }
  }, [safeSetState, setSafeError])

  // Get initial session with retry
  useEffect(() => {
    let mounted = true
    let retryCount = 0
    const maxRetries = 3
    let backoffDelay = 1000

    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabaseRef.current.auth.getSession()
        if (error) throw error
        
        if (mounted) {
          setSession(session)
          setSafeError(null)
          if (session) {
            setupTokenRefresh(session)
            startSessionCheck()
          }
        }
      } catch (e) {
        if (!mounted) return

        retryCount++
        if (retryCount < maxRetries) {
          // Exponential backoff
          backoffDelay *= 2
          setTimeout(getSession, backoffDelay)
        } else {
          if (mounted) {
            setSafeError(e)
            setSession(null)
          }
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getSession()
    return () => {
      mounted = false
    }
  }, [setupTokenRefresh, setSafeError, startSessionCheck])

  // Listen for auth changes with automatic resubscription
  useEffect(() => {
    let retryCount = 0
    const maxRetries = 3
    let backoffDelay = 1000

    const setupAuthListener = () => {
      try {
        const {
          data: { subscription },
        } = supabaseRef.current.auth.onAuthStateChange(async (event, session) => {
          if (!mountedRef.current) return

          safeSetState(() => {
            setSession(session)
            setSafeError(null)
            setLoading(false)
          })

          if (session) {
            setupTokenRefresh(session)
            startSessionCheck()
          }

          if (onAuthStateChange) {
            onAuthStateChange(event, session)
          }
        })

        if (authSubscriptionRef.current) {
          try {
            authSubscriptionRef.current.unsubscribe()
          } catch (e) {
            console.warn('Error unsubscribing from previous auth changes:', e)
          }
        }

        authSubscriptionRef.current = subscription
      } catch (e) {
        if (!mountedRef.current) return

        retryCount++
        if (retryCount < maxRetries) {
          // Exponential backoff
          backoffDelay *= 2
          setTimeout(setupAuthListener, backoffDelay)
        } else {
          console.error('Failed to setup auth listener after retries:', e)
        }
      }
    }

    setupAuthListener()

    return () => {
      if (authSubscriptionRef.current) {
        try {
          authSubscriptionRef.current.unsubscribe()
        } catch (e) {
          console.warn('Error unsubscribing from auth changes:', e)
        }
      }
    }
  }, [safeSetState, setupTokenRefresh, setSafeError, startSessionCheck, onAuthStateChange])

  // Comprehensive cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false

      // Clear all timers
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
      }
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current)
      }
      if (sessionCheckRef.current) {
        clearInterval(sessionCheckRef.current)
      }

      // Unsubscribe from auth changes
      if (authSubscriptionRef.current) {
        try {
          authSubscriptionRef.current.unsubscribe()
        } catch (e) {
          console.warn('Error cleaning up auth subscription:', e)
        }
      }

      // Clear session if not persisting
      if (!sessionPersistence) {
        try {
          window.sessionStorage.removeItem('supabase.auth.token')
        } catch (e) {
          console.warn('Error clearing session storage:', e)
        }
      }
    }
  }, [sessionPersistence])

  // Sign in with email/password
  const signIn = useCallback(async ({ email, password }) => {
    try {
      setLoading(true)
      clearError()
      const { data, error } = await supabaseRef.current.auth.signInWithPassword({
        email,
        password
      })
      if (error) throw error

      safeSetState(() => {
        setSession(data.session)
        setSafeError(null)
      })

      if (data.session) {
        setupTokenRefresh(data.session)
      }

      return data
    } catch (e) {
      setSafeError(e)
      throw e
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [safeSetState, setupTokenRefresh, setSafeError])

  // Sign up with email/password
  const signUp = useCallback(async ({ email, password }) => {
    try {
      setLoading(true)
      clearError()
      const { data, error } = await supabaseRef.current.auth.signUp({
        email,
        password
      })
      if (error) throw error

      safeSetState(() => {
        if (data.session) {
          setSession(data.session)
          setupTokenRefresh(data.session)
        }
        setSafeError(null)
      })

      return data
    } catch (e) {
      setSafeError(e)
      throw e
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [safeSetState, setupTokenRefresh, setSafeError])

  // Sign out
  const signOut = useCallback(async () => {
    try {
      setLoading(true)
      clearError()
      const { error } = await supabaseRef.current.auth.signOut()
      if (error) throw error

      // Clear session and timers
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
      }
      
      safeSetState(() => {
        setSession(null)
        setSafeError(null)
      })
    } catch (e) {
      setSafeError(e)
      throw e
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [safeSetState, setSafeError])

  // Reset password
  const resetPassword = useCallback(async (email) => {
    try {
      setLoading(true)
      setSafeError(null)
      const { error } = await supabaseRef.current.auth.resetPasswordForEmail(email)
      if (error) throw error
    } catch (e) {
      safeSetState(() => setSafeError(e))
      throw e
    } finally {
      safeSetState(() => setLoading(false))
    }
  }, [safeSetState, setSafeError])

  // Update password
  const updatePassword = useCallback(async (newPassword) => {
    try {
      setLoading(true)
      setSafeError(null)
      const { error } = await supabaseRef.current.auth.updateUser({
        password: newPassword
      })
      if (error) throw error
    } catch (e) {
      safeSetState(() => setSafeError(e))
      throw e
    } finally {
      safeSetState(() => setLoading(false))
    }
  }, [safeSetState, setSafeError])

  const value = {
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    clearError,
    isAuthenticated: !!session?.user,
    user: session?.user || null
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
  supabase: PropTypes.object,
  supabaseUrl: PropTypes.string,
  supabaseKey: PropTypes.string,
  sessionPersistence: PropTypes.bool,
  refreshInterval: PropTypes.number,
  onAuthStateChange: PropTypes.func
}

export default AuthProvider 