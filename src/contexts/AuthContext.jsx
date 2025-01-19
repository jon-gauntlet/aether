import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mounted, setMounted] = useState(true)

  useEffect(() => {
    setMounted(true)
    let cancelled = false
    
    // Check for existing session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!cancelled && session) {
          setUser(session.user)
          await localStorage.setItem('auth_token', session.access_token)
          await localStorage.setItem('user', JSON.stringify(session.user))
        }
      } catch (err) {
        console.error('Session check error:', err)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    checkSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (cancelled) return

      if (session) {
        setUser(session.user)
        await localStorage.setItem('auth_token', session.access_token)
        await localStorage.setItem('user', JSON.stringify(session.user))
      } else {
        setUser(null)
        await localStorage.removeItem('auth_token')
        await localStorage.removeItem('user')
      }
    })

    return () => {
      cancelled = true
      setMounted(false)
      subscription.unsubscribe()
    }
  }, [])

  const handleAuthResponse = useCallback(async (data, error) => {
    if (!mounted) return { user: null, error: 'Component unmounted' }

    if (error) {
      const errorMessage = error.message || error
      setError(errorMessage)
      return { user: null, error: errorMessage }
    }

    if (!data?.session?.access_token) {
      const err = 'Invalid response from server'
      setError(err)
      return { user: null, error: err }
    }

    const token = data.session.access_token
    const userData = data.session.user

    try {
      await localStorage.setItem('auth_token', token)
      await localStorage.setItem('user', JSON.stringify(userData))
      if (mounted) {
        setUser(userData)
        setError(null)
      }
      return { user: userData, error: null }
    } catch (err) {
      const errorMessage = 'Failed to save auth data'
      setError(errorMessage)
      return { user: null, error: errorMessage }
    }
  }, [mounted])

  const login = useCallback(async (email, password) => {
    if (!mounted) return { user: null, error: 'Component unmounted' }

    try {
      setLoading(true)
      setError(null)

      // First try REST API login
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (response.ok && data?.token) {
        const { token, user } = data
        await localStorage.setItem('auth_token', token)
        await localStorage.setItem('user', JSON.stringify(user))
        if (mounted) {
          setUser(user)
          setError(null)
        }
        return { user, error: null }
      }

      // Try Supabase login as fallback
      const { data: supabaseData, error: supabaseError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (supabaseError) {
        throw new Error(supabaseError.message || 'Invalid email or password')
      }

      if (supabaseData?.session) {
        const userData = {
          id: supabaseData.session.user.id,
          email: supabaseData.session.user.email
        }
        await localStorage.setItem('auth_token', supabaseData.session.access_token)
        await localStorage.setItem('user', JSON.stringify(userData))
        if (mounted) {
          setUser(userData)
          setError(null)
        }
        return { user: userData, error: null }
      }

      throw new Error('Login failed')
    } catch (error) {
      const errorMessage = error.message || 'Error logging in'
      if (mounted) {
        setError(errorMessage)
      }
      return { user: null, error: errorMessage }
    } finally {
      if (mounted) {
        setLoading(false)
      }
    }
  }, [mounted])

  const signup = useCallback(async ({ email, password }) => {
    if (!mounted) return { user: null, error: 'Component unmounted' }

    try {
      setLoading(true)
      setError(null)

      // First try REST API
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (response.ok && data?.token) {
        const { token, user } = data
        await localStorage.setItem('auth_token', token)
        await localStorage.setItem('user', JSON.stringify(user))
        if (mounted) {
          setUser(user)
          setError(null)
        }
        return { user, error: null }
      }

      if (data.error) {
        throw new Error(data.error)
      }

      // If REST API fails, try Supabase
      const { data: supabaseData, error: supabaseError } = await supabase.auth.signUp({
        email,
        password
      })

      if (supabaseError) {
        throw new Error(supabaseError.message || 'Signup failed')
      }

      if (supabaseData?.session) {
        const userData = {
          id: supabaseData.session.user.id,
          email: supabaseData.session.user.email
        }
        await localStorage.setItem('auth_token', supabaseData.session.access_token)
        await localStorage.setItem('user', JSON.stringify(userData))
        if (mounted) {
          setUser(userData)
          setError(null)
        }
        return { user: userData, error: null }
      }

      throw new Error('Signup failed')
    } catch (error) {
      const errorMessage = error.message || 'Error signing up'
      if (mounted) {
        setError(errorMessage)
      }
      return { user: null, error: errorMessage }
    } finally {
      if (mounted) {
        setLoading(false)
      }
    }
  }, [mounted])

  const logout = useCallback(async () => {
    if (!mounted) return { error: 'Component unmounted' }

    try {
      setLoading(true)
      setError(null)

      let restApiError = null
      let supabaseError = null

      // First try REST API logout
      const token = await localStorage.getItem('auth_token')
      if (token) {
        try {
          const response = await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })

          const data = await response.json()
          if (!response.ok || !data?.success) {
            restApiError = data.error || 'REST API logout failed'
          }
        } catch (error) {
          restApiError = error.message || 'Network error'
        }
      }

      // Then try Supabase logout
      try {
        const { error: error } = await supabase.auth.signOut()
        if (error) {
          supabaseError = error.message || 'Supabase logout failed'
        }
      } catch (error) {
        supabaseError = error.message || 'Supabase error'
      }

      // Clear local storage and state regardless of API results
      await localStorage.removeItem('auth_token')
      await localStorage.removeItem('user')
      if (mounted) {
        setUser(null)
      }

      // Handle errors after cleanup
      if (restApiError && supabaseError) {
        throw new Error(`${restApiError}; ${supabaseError}`)
      } else if (restApiError) {
        throw new Error(restApiError)
      } else if (supabaseError) {
        throw new Error(supabaseError)
      }

      return { error: null }
    } catch (error) {
      const errorMessage = error.message || 'Error logging out'
      if (mounted) {
        setError(errorMessage)
      }
      return { error: errorMessage }
    } finally {
      if (mounted) {
        setLoading(false)
      }
    }
  }, [mounted])

  const value = {
    user,
    loading,
    error,
    login,
    signup,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 