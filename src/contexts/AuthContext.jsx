import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user)
        localStorage.setItem('auth_token', session.access_token)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user)
        localStorage.setItem('auth_token', session.access_token)
      } else {
        setUser(null)
        localStorage.removeItem('auth_token')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async ({ email, password }) => {
    try {
      setLoading(true)
      
      // First try REST API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const apiData = await response.json()
      
      if (!response.ok) {
        // If REST API fails, try Supabase
        const { data, error: supabaseError } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (supabaseError) {
          return { user: null, error: supabaseError.message || 'Invalid credentials' }
        }

        if (!data?.session?.access_token) {
          return { user: null, error: 'Invalid response from server' }
        }

        localStorage.setItem('auth_token', data.session.access_token)
        setUser(data.user)
        return { user: data.user, error: null }
      }

      // REST API auth succeeded
      localStorage.setItem('auth_token', apiData.session.token)
      setUser(apiData.user)
      return { user: apiData.user, error: null }
    } catch (error) {
      console.error('Login error:', error)
      return { user: null, error: error.message || 'Network error' }
    } finally {
      setLoading(false)
    }
  }

  const logout = useCallback(async () => {
    try {
      // First try REST API logout
      const token = localStorage.getItem('auth_token')
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      }

      // Then try Supabase logout
      await supabase.auth.signOut()
    } catch (err) {
      console.error('Logout error:', err)
      setError(err.message)
    } finally {
      localStorage.removeItem('auth_token')
      setUser(null)
    }
  }, [])

  const value = {
    user,
    loading,
    error,
    login,
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