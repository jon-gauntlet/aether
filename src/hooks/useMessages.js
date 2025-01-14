import { useState, useCallback } from 'react'
import { collection, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'

/**
 * @typedef {Object} Message
 * @property {string} id - Message ID
 * @property {string} text - Message content
 * @property {string} userId - ID of user who sent message
 * @property {boolean} isOwn - Whether current user sent message
 * @property {Date} timestamp - When message was sent
 */

/**
 * Hook for managing messages
 * @param {string} spaceId - ID of space to manage messages for
 * @returns {Object} Message operations and state
 */
const useMessages = (spaceId) => {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Send a new message
   * @param {string} text - Message content
   * @returns {Promise<void>}
   */
  const sendMessage = useCallback(async (text) => {
    try {
      setLoading(true)
      const messagesRef = collection(db, `spaces/${spaceId}/messages`)
      const docRef = await addDoc(messagesRef, {
        text,
        userId: 'current-user', // TODO: Get from auth
        timestamp: serverTimestamp()
      })

      setMessages(prev => [...prev, {
        id: docRef.id,
        text,
        isOwn: true,
        timestamp: new Date()
      }])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [spaceId])

  /**
   * Delete a message
   * @param {string} messageId - ID of message to delete
   * @returns {Promise<void>}
   */
  const deleteMessage = useCallback(async (messageId) => {
    try {
      setLoading(true)
      const messageRef = doc(db, `spaces/${spaceId}/messages/${messageId}`)
      await deleteDoc(messageRef)
      setMessages(prev => prev.filter(msg => msg.id !== messageId))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [spaceId])

  /**
   * Update a message
   * @param {string} messageId - ID of message to update
   * @param {string} text - New message content
   * @returns {Promise<void>}
   */
  const updateMessage = useCallback(async (messageId, text) => {
    try {
      setLoading(true)
      const messageRef = doc(db, `spaces/${spaceId}/messages/${messageId}`)
      await updateDoc(messageRef, { text })
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, text } : msg
      ))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [spaceId])

  return {
    messages,
    loading,
    error,
    sendMessage,
    deleteMessage,
    updateMessage
  }
}

export default useMessages