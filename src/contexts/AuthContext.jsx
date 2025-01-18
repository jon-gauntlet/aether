import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        localStorage.setItem('auth_token', session.access_token)
      } else {
        setUser(null)
        localStorage.removeItem('auth_token')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function checkAuth() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      if (session?.user) {
        setUser(session.user)
        localStorage.setItem('auth_token', session.access_token)
      }
    } catch (error) {
      console.error('Error checking auth state:', error)
      setUser(null)
      localStorage.removeItem('auth_token')
    } finally {
      setLoading(false)
    }
  }

  async function login({ email, password }) {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      
      // Store token and user data
      localStorage.setItem('auth_token', data.session.access_token)
      setUser(data.user)
      return { user: data.user, error: null }
    } catch (error) {
      console.error('Login error:', error)
      setUser(null)
      localStorage.removeItem('auth_token')
      return { user: null, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Clear auth state
      setUser(null)
      localStorage.removeItem('auth_token')
    } catch (error) {
      console.error('Logout error:', error)
      return { error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    loading,
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