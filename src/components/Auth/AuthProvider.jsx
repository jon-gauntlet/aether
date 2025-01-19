import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import PropTypes from 'prop-types'

const AuthContext = createContext(null)

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
  supabaseUrl = process.env.VITE_SUPABASE_URL,
  supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
}) => {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Use provided supabase instance or create new one
  const supabase = customSupabase || createClient(supabaseUrl, supabaseKey)

  // Get initial session
  useEffect(() => {
    let mounted = true

    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        if (mounted) {
          setSession(session)
          setError(null)
        }
      } catch (e) {
        if (mounted) {
          setError(e.message)
          setSession(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getSession()

    // Cleanup
    return () => {
      mounted = false
    }
  }, [supabase.auth])

  // Listen for auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setError(null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  // Sign in with email/password
  const signIn = useCallback(async ({ email, password }) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) throw error
      return data
    } catch (e) {
      setError(e.message)
      throw e
    } finally {
      setLoading(false)
    }
  }, [supabase.auth])

  // Sign up with email/password
  const signUp = useCallback(async ({ email, password }) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      })
      if (error) throw error
      return data
    } catch (e) {
      setError(e.message)
      throw e
    } finally {
      setLoading(false)
    }
  }, [supabase.auth])

  // Sign out
  const signOut = useCallback(async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setSession(null)
    } catch (e) {
      setError(e.message)
      throw e
    } finally {
      setLoading(false)
    }
  }, [supabase.auth])

  // Reset password
  const resetPassword = useCallback(async (email) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) throw error
    } catch (e) {
      setError(e.message)
      throw e
    } finally {
      setLoading(false)
    }
  }, [supabase.auth])

  // Update password
  const updatePassword = useCallback(async (newPassword) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      if (error) throw error
    } catch (e) {
      setError(e.message)
      throw e
    } finally {
      setLoading(false)
    }
  }, [supabase.auth])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    clearError
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
  supabaseKey: PropTypes.string
}

export default AuthProvider 