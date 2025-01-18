import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../utils/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'

export function useMessages() {
  const [messages, setMessages] = useState([])
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const messageQueue = useRef([])
  const { user } = useAuth()
  const { addNotification } = useNotifications()
  const messageChannelRef = useRef(null)
  const readReceiptChannelRef = useRef(null)

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      processMessageQueue()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Process queued messages when back online
  const processMessageQueue = useCallback(async () => {
    const queue = messageQueue.current
    messageQueue.current = []

    for (const message of queue) {
      try {
        await sendMessage(message.text)
        addNotification({
          type: 'success',
          title: 'Message sent',
          message: 'Your queued message has been delivered'
        })
      } catch (err) {
        messageQueue.current.push(message)
        addNotification({
          type: 'error',
          title: 'Failed to send queued message',
          message: err.message
        })
        break
      }
    }
  }, [addNotification])

  // Fetch initial messages
  useEffect(() => {
    async function fetchMessages() {
      try {
        const { data, error } = await supabase
          .from(import.meta.env.VITE_SUPABASE_TABLE_MESSAGES)
          .select(`
            *,
            read_receipts:message_read_receipts(user_id, read_at)
          `)
          .order('created_at', { ascending: true })

        if (error) throw error
        
        // Mark messages as delivered when loading
        const messagesToUpdate = data
          .filter(msg => msg.status === 'sent' && msg.user_id !== user?.id)
          .map(msg => msg.id)

        if (messagesToUpdate.length > 0) {
          const { error: updateError } = await supabase
            .from(import.meta.env.VITE_SUPABASE_TABLE_MESSAGES)
            .update({ status: 'delivered' })
            .in('id', messagesToUpdate)

          if (updateError) {
            console.error('Failed to mark messages as delivered:', updateError)
          }
        }

        setMessages(data)
      } catch (err) {
        setError(err.message)
        addNotification({
          type: 'error',
          title: 'Failed to load messages',
          message: err.message
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchMessages()
  }, [user, addNotification])

  // Subscribe to new messages and status updates
  useEffect(() => {
    messageChannelRef.current = supabase
      .channel(import.meta.env.VITE_SUPABASE_REALTIME_CHANNEL)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: import.meta.env.VITE_SUPABASE_TABLE_MESSAGES
      }, (payload) => {
        setMessages(prev => [...prev, { ...payload.new, read_receipts: [] }])
        
        // Auto-mark as delivered if it's not our message
        if (payload.new.user_id !== user?.id && payload.new.status === 'sent') {
          markDelivered(payload.new.id)
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: import.meta.env.VITE_SUPABASE_TABLE_MESSAGES
      }, (payload) => {
        setMessages(prev => prev.map(msg => 
          msg.id === payload.new.id 
            ? { ...msg, ...payload.new, read_receipts: msg.read_receipts }
            : msg
        ))
      })
      .subscribe()

    readReceiptChannelRef.current = supabase
      .channel('read_receipts')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'message_read_receipts'
      }, (payload) => {
        setMessages(prev => prev.map(msg => {
          if (msg.id === payload.new.message_id) {
            const receipts = msg.read_receipts || []
            if (payload.eventType === 'INSERT') {
              // Avoid duplicate read receipts
              if (!receipts.some(r => r.user_id === payload.new.user_id)) {
                return {
                  ...msg,
                  read_receipts: [...receipts, payload.new]
                }
              }
            } else if (payload.eventType === 'DELETE') {
              return {
                ...msg,
                read_receipts: receipts.filter(r => r.user_id !== payload.old.user_id)
              }
            }
          }
          return msg
        }))
      })
      .subscribe()

    return () => {
      if (messageChannelRef.current) {
        supabase.removeChannel(messageChannelRef.current)
      }
      if (readReceiptChannelRef.current) {
        supabase.removeChannel(readReceiptChannelRef.current)
      }
    }
  }, [user])

  // Enhanced sendMessage function with offline support
  const sendMessage = useCallback(async (text) => {
    if (!user) throw new Error('Must be logged in to send messages')

    // If offline, queue the message
    if (!isOnline) {
      const queuedMessage = {
        id: `queued_${Date.now()}`,
        text,
        status: 'queued',
        user_id: user.id,
        user_email: user.email,
        created_at: new Date().toISOString(),
        read_receipts: []
      }
      messageQueue.current.push(queuedMessage)
      setMessages(prev => [...prev, queuedMessage])
      addNotification({
        type: 'info',
        title: 'Message queued',
        message: 'Your message will be sent when you\'re back online'
      })
      return queuedMessage
    }

    try {
      // First, insert the message with 'sending' status
      const { data: message, error: insertError } = await supabase
        .from(import.meta.env.VITE_SUPABASE_TABLE_MESSAGES)
        .insert([{ 
          text, 
          status: 'sending',
          user_id: user.id,
          user_email: user.email
        }])
        .select()
        .single()

      if (insertError) throw insertError

      // Optimistically update local state
      setMessages(prev => [...prev, { ...message, read_receipts: [] }])

      // Update the message status to 'sent' after successful insert
      const { error: updateError } = await supabase
        .from(import.meta.env.VITE_SUPABASE_TABLE_MESSAGES)
        .update({ status: 'sent' })
        .eq('id', message.id)

      if (updateError) throw updateError

      return message
    } catch (err) {
      setError(err.message)
      addNotification({
        type: 'error',
        title: 'Failed to send message',
        message: err.message
      })
      throw err
    }
  }, [user, addNotification, isOnline])

  // Mark message as delivered
  const markDelivered = useCallback(async (messageId) => {
    try {
      const { error } = await supabase
        .from(import.meta.env.VITE_SUPABASE_TABLE_MESSAGES)
        .update({ status: 'delivered' })
        .eq('id', messageId)

      if (error) throw error
    } catch (err) {
      console.error('Failed to mark message as delivered:', err)
    }
  }, [])

  // Mark message as read
  const markRead = useCallback(async (messageId) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('message_read_receipts')
        .upsert({
          message_id: messageId,
          user_id: user.id,
          read_at: new Date().toISOString()
        })

      if (error) throw error
    } catch (err) {
      console.error('Failed to mark message as read:', err)
    }
  }, [user])

  return {
    messages,
    sendMessage,
    markRead,
    error,
    isLoading,
    isOnline
  }
} 