import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { db } from '@/core/firebase'
import { collection, addDoc, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore'
import { useAuth } from '@/core/auth/AuthProvider'
import { BehaviorSubject } from 'rxjs'

const GOLDEN_RATIO = 1.618033988749895
const NATURAL_CYCLE = 8000

export interface Message {
  id: string
  text: string
  userId: string
  userName: string
  timestamp: Timestamp
  energyLevel: number
  coherenceLevel: number
  resonance: {
    natural: number
    harmonic: number
    flow: number
  }
}

interface MessageContextType {
  messages: Message[]
  sendMessage: (text: string) => Promise<void>
  loading: boolean
  systemResonance: number
}

const MessageContext = createContext<MessageContextType | undefined>(undefined)

export const MessageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const { user, consciousnessState } = useAuth()
  const resonance$ = useRef(new BehaviorSubject(1))

  useEffect(() => {
    const interval = setInterval(() => {
      const current = resonance$.current.value
      const natural = Math.min(1.5, current + (1 / GOLDEN_RATIO) * 0.1)
      resonance$.current.next(natural)
    }, NATURAL_CYCLE)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!user) return

    const q = query(collection(db, 'messages'), orderBy('timestamp', 'desc'))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[]
      
      setMessages(newMessages)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  const sendMessage = async (text: string) => {
    if (!user) return

    try {
      const currentResonance = resonance$.current.value
      await addDoc(collection(db, 'messages'), {
        text,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        timestamp: Timestamp.now(),
        energyLevel: consciousnessState?.energy?.level || 100,
        coherenceLevel: consciousnessState?.coherence || 100,
        resonance: {
          natural: currentResonance,
          harmonic: currentResonance * GOLDEN_RATIO,
          flow: Math.min(1, currentResonance * 0.8)
        }
      })
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const value = {
    messages,
    sendMessage,
    loading,
    systemResonance: resonance$.current.value
  }

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  )
}

export const useMessages = () => {
  const context = useContext(MessageContext)
  if (context === undefined) {
    throw new Error('useMessages must be used within a MessageProvider')
  }
  return context
} 