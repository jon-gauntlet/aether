import React, { createContext, useContext, useEffect, useState } from 'react'
import { auth } from '@/core/firebase'
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged,
} from 'firebase/auth'

/**
 * @typedef {Object} ConsciousnessState
 * @property {number} energyLevel - The current energy level
 * @property {boolean} isCoherent - Whether the consciousness is coherent
 */

/**
 * @typedef {Object} AuthContextType
 * @property {import('firebase/auth').User|null} user - The current user
 * @property {ConsciousnessState} consciousnessState - The consciousness state
 * @property {() => Promise<void>} signIn - Function to sign in
 * @property {() => Promise<void>} signOut - Function to sign out
 * @property {boolean} loading - Whether auth is loading
 */

const AuthContext = createContext(/** @type {AuthContextType|undefined} */ (undefined))

/**
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [consciousnessState, setConsciousnessState] = useState({
    energyLevel: 0,
    isCoherent: false
  })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const signIn = async () => {
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
    } catch (error) {
      console.error('Error signing in:', error)
    }
  }

  const signOut = async () => {
    try {
      await auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      consciousnessState,
      signIn,
      signOut,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * @returns {AuthContextType}
 */
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 