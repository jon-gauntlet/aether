import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { db } from '@/core/firebase'
import { collection, addDoc, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore'
import { useAuth } from '@/core/auth/AuthProvider'
import { BehaviorSubject } from 'rxjs'

const GOLDEN_RATIO = 1.618033988749895
const NATURAL_CYCLE = 8000

/**
 * @typedef {Object} MessageResonance
 * @property {number} natural - Natural resonance level
 * @property {number} harmonic - Harmonic resonance level
 * @property {number} flow - Flow resonance level
 */

/**
 * @typedef {Object} Message
 * @property {string} id - Message ID
 * @property {string} text - Message content
 * @property {string} userId - User ID who sent the message
 * @property {string} userName - Name of the user who sent the message
 * @property {import('firebase/firestore').Timestamp} timestamp - When the message was sent
 * @property {number} energyLevel - Energy level of the message
 * @property {number} coherenceLevel - Coherence level of the message
 * @property {MessageResonance} resonance - Resonance metrics
 */

/**
 * @typedef {Object} MessageContextType
 * @property {Message[]} messages - Array of messages
 * @property {(text: string) => Promise<void>} sendMessage - Function to send a message
 * @property {boolean} loading - Whether messages are loading
 * @property {number} systemResonance - Current system resonance level
 */

const MessageContext = createContext(/** @type {MessageContextType|undefined} */ (undefined))

const resonanceSubject = new BehaviorSubject(0)

/**
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export const MessageProvider = ({ children }) => {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [systemResonance, setSystemResonance] = useState(0)
  const { user } = useAuth()
  const messagesRef = useRef(collection(db, 'messages'))
  
  useEffect(() => {
    if (!user) return

    const q = query(messagesRef.current, orderBy('timestamp', 'asc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setMessages(newMessages)
      setLoading(false)
      
      // Calculate system resonance
      const totalResonance = newMessages.reduce((sum, msg) => 
        sum + (msg.resonance?.natural || 0) * GOLDEN_RATIO +
        (msg.resonance?.harmonic || 0) +
        (msg.resonance?.flow || 0), 0)
      
      const avgResonance = totalResonance / (newMessages.length || 1)
      setSystemResonance(avgResonance)
      resonanceSubject.next(avgResonance)
    })

    return () => unsubscribe()
  }, [user])

  const sendMessage = async (text) => {
    if (!user) return

    try {
      const resonance = {
        natural: Math.random(),
        harmonic: Math.random(),
        flow: Math.random()
      }

      await addDoc(messagesRef.current, {
        text,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        timestamp: Timestamp.now(),
        energyLevel: Math.random() * 100,
        coherenceLevel: Math.random(),
        resonance
      })
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  return (
    <MessageContext.Provider value={{
      messages,
      sendMessage,
      loading,
      systemResonance
    }}>
      {children}
    </MessageContext.Provider>
  )
}

/**
 * @returns {MessageContextType}
 */
export const useMessages = () => {
  const context = useContext(MessageContext)
  if (context === undefined) {
    throw new Error('useMessages must be used within a MessageProvider')
  }
  return context
} 