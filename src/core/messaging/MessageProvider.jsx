import React, { createContext, useContext, useEffect, useState } from 'react'
import { db } from '../firebase'
import { collection, addDoc, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore'
import { useAuth } from '../auth/AuthProvider'

const MessagesContext = createContext(undefined)
const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY

export const MessageProvider = ({ children }) => {
  const [messages, setMessages] = useState([])
  const [threads, setThreads] = useState({})
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      console.log('No user, skipping message subscription')
      setMessages([])
      setLoading(false)
      return
    }

    console.log('Setting up messages subscription')
    const messagesRef = collection(db, 'messages')
    const q = query(messagesRef, orderBy('timestamp', 'asc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('Messages snapshot received:', snapshot.size)
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isOwn: doc.data().userId === user.uid
      }))
      setMessages(newMessages)
      setLoading(false)
    }, (error) => {
      console.error('Error in messages subscription:', error)
      setLoading(false)
    })

    return () => {
      console.log('Cleaning up messages subscription')
      unsubscribe()
    }
  }, [user])

  const uploadToImgBB = async (file) => {
    console.log('Uploading file to ImgBB:', file.name)
    const formData = new FormData()
    formData.append('image', file)
    formData.append('key', IMGBB_API_KEY)

    try {
      const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`ImgBB upload failed: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('ImgBB upload successful:', data)

      if (data.success) {
        return {
          fileUrl: data.data.url,
          fileName: file.name,
          fileType: file.type,
          thumbnailUrl: data.data.thumb?.url
        }
      } else {
        throw new Error('ImgBB upload failed')
      }
    } catch (error) {
      console.error('Error uploading to ImgBB:', error)
      throw new Error('Failed to upload file: ' + error.message)
    }
  }

  const sendMessage = async (text, spaceType = 'Commons', file = null) => {
    if (!user) {
      console.error('No user found')
      throw new Error('You must be signed in to send messages')
    }

    setLoading(true)
    try {
      let fileData = null

      if (file) {
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          throw new Error('File size must be less than 10MB')
        }
        fileData = await uploadToImgBB(file)
      }

      const messageData = {
        text: text || '',
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        timestamp: Timestamp.now(),
        spaceType,
        ...(fileData && {
          fileUrl: fileData.fileUrl,
          fileName: fileData.fileName,
          fileType: fileData.fileType,
          thumbnailUrl: fileData.thumbnailUrl
        })
      }

      console.log('Saving message:', messageData)
      const docRef = await addDoc(collection(db, 'messages'), messageData)
      console.log('Message saved with ID:', docRef.id)
      return docRef
    } catch (error) {
      console.error('Error in sendMessage:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const loadThread = async (messageId) => {
    setThreads(prev => ({
      ...prev,
      [messageId]: []
    }))
  }

  return (
    <MessagesContext.Provider value={{
      messages,
      threads,
      sendMessage,
      loadThread,
      loading
    }}>
      {children}
    </MessagesContext.Provider>
  )
}

export const useMessages = () => {
  const context = useContext(MessagesContext)
  if (context === undefined) {
    throw new Error('useMessages must be used within a MessageProvider')
  }
  return context
} 