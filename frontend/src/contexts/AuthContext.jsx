import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check for existing auth on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      checkAuth()
    } else {
      setLoading(false)
    }
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Auth check failed')
      }

      const data = await response.json()
      setUser(data.user)
    } catch (err) {
      setError(err.message)
      localStorage.removeItem('auth_token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  async function login({ email, password }) {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        setUser(null)
        localStorage.removeItem('auth_token')
        return { user: null, error: error.message || 'Invalid credentials' }
      }
      
      if (!data?.session?.access_token) {
        return { user: null, error: 'Invalid response from server' }
      }

      // Store token and user data
      localStorage.setItem('auth_token', data.session.access_token)
      setUser(data.user)
      return { user: data.user, error: null }
    } catch (error) {
      console.error('Login error:', error)
      setUser(null)
      localStorage.removeItem('auth_token')
      return { user: null, error: error.message || 'An error occurred during login' }
    } finally {
      setLoading(false)
    }
  }

  const logout = useCallback(async () => {
    try {
      localStorage.removeItem('auth_token')
      setUser(null)
    } catch (err) {
      setError(err.message)
    }
  }, [])

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    checkAuth
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