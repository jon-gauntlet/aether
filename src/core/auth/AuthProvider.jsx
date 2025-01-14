import React, { createContext, useContext, useEffect, useState } from 'react'
import { auth } from '../firebase'
import { 
  signInWithPopup, 
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword, 
  onAuthStateChanged,
  signOut as firebaseSignOut
} from 'firebase/auth'

const AuthContext = createContext(undefined)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    console.log('Setting up auth state listener')
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? 'User authenticated' : 'No user')
      setUser(user)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    console.log('Attempting Google sign in')
    const provider = new GoogleAuthProvider()
    try {
      setError(null)
      const result = await signInWithPopup(auth, provider)
      console.log('Sign in successful:', result.user.email)
      return result.user
    } catch (error) {
      console.error('Error signing in with Google:', error)
      setError(error.message)
      throw error
    }
  }

  const signInWithEmail = async (email, password) => {
    console.log('Attempting email sign in:', email)
    try {
      setError(null)
      const result = await signInWithEmailAndPassword(auth, email, password)
      console.log('Sign in successful:', result.user.email)
      return result.user
    } catch (error) {
      console.error('Error signing in with email:', error)
      setError(error.message)
      throw error
    }
  }

  const signUpWithEmail = async (email, password) => {
    console.log('Attempting email sign up:', email)
    try {
      setError(null)
      const result = await createUserWithEmailAndPassword(auth, email, password)
      console.log('Sign up successful:', result.user.email)
      return result.user
    } catch (error) {
      console.error('Error signing up with email:', error)
      setError(error.message)
      throw error
    }
  }

  const signOut = async () => {
    console.log('Attempting sign out')
    try {
      await firebaseSignOut(auth)
      console.log('Sign out successful')
    } catch (error) {
      console.error('Error signing out:', error)
      setError(error.message)
      throw error
    }
  }

  console.log('AuthProvider state:', { user, loading, error })

  return (
    <AuthContext.Provider value={{
      user,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      loading,
      error
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 