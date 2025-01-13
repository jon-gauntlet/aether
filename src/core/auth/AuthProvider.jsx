import React, { createContext, useContext, useEffect, useState } from 'react'
import { auth } from '@/core/firebase'
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged,
  User
} from 'firebase/auth'
import { ConsciousnessState } from '@/components/Consciousness'

interface AuthContextType {
  user: User | null
  consciousnessState: ConsciousnessState
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [consciousnessState, setConsciousnessState] = useState<ConsciousnessState>({
    energyLevel: 0,
    isCoherent: false
  })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
      // Update consciousness state based on auth
      setConsciousnessState({
        energyLevel: user ? 85 : 0,
        isCoherent: !!user
      })
    })

    return unsubscribe
  }, [])

  const signIn = async () => {
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
    } catch (error) {
      console.error('Auth error:', error)
    }
  }

  const signOut = async () => {
    try {
      await auth.signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        consciousnessState,
        signIn, 
        signOut, 
        loading 
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (undefined === context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
} 