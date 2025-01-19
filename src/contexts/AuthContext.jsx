import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem('auth_token')
    const userEmail = localStorage.getItem('user_email')
    if (token && userEmail) {
      setUser({ email: userEmail })
    }
    setLoading(false)
  }, [])

  const signIn = async (email, password) => {
    // For demo purposes, we'll use a simple authentication
    // In production, this should validate against your backend
    if (email && password) {
      const token = btoa(`${email}:${password}`) // This is just for demo
      localStorage.setItem('auth_token', token)
      localStorage.setItem('user_email', email)
      setUser({ email })
      return true
    }
    throw new Error('Invalid credentials')
  }

  const signOut = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_email')
    setUser(null)
  }

  const value = {
    user,
    loading,
    signIn,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
} 