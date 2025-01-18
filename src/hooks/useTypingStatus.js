import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../utils/supabase'
import { useAuth } from '../contexts/AuthContext'

const TYPING_TIMEOUT = 3000 // 3 seconds
const DEBOUNCE_DELAY = 500 // 500ms

export function useTypingStatus() {
  const [typingUsers, setTypingUsers] = useState({})
  const { user } = useAuth()
  const typingChannelRef = useRef(null)
  const timeoutsRef = useRef({})

  // Subscribe to typing status updates
  useEffect(() => {
    typingChannelRef.current = supabase
      .channel('typing_status')
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { user_id, user_email, is_typing } = payload.payload

        // Don't show typing indicator for current user
        if (user_id === user?.id) return

        setTypingUsers(prev => {
          // Clear existing timeout for this user
          if (timeoutsRef.current[user_id]) {
            clearTimeout(timeoutsRef.current[user_id])
          }

          if (is_typing) {
            // Set new timeout to clear typing status
            timeoutsRef.current[user_id] = setTimeout(() => {
              setTypingUsers(prev => {
                const { [user_id]: removed, ...rest } = prev
                return rest
              })
              delete timeoutsRef.current[user_id]
            }, TYPING_TIMEOUT)

            return {
              ...prev,
              [user_id]: { email: user_email, timestamp: Date.now() }
            }
          } else {
            // User stopped typing
            const { [user_id]: removed, ...rest } = prev
            return rest
          }
        })
      })
      .subscribe()

    return () => {
      // Clear all timeouts
      Object.values(timeoutsRef.current).forEach(clearTimeout)
      
      if (typingChannelRef.current) {
        supabase.removeChannel(typingChannelRef.current)
      }
    }
  }, [user])

  // Function to broadcast typing status
  const broadcastTypingStatus = useCallback(
    async (isTyping = true) => {
      if (!user) return

      try {
        await supabase.channel('typing_status').send({
          type: 'broadcast',
          event: 'typing',
          payload: {
            user_id: user.id,
            user_email: user.email,
            is_typing: isTyping
          }
        })
      } catch (error) {
        console.error('Failed to broadcast typing status:', error)
      }
    },
    [user]
  )

  // Debounced version of broadcast function
  const debouncedBroadcast = useCallback(() => {
    let timeoutId

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(() => {
        broadcastTypingStatus(true)
        
        // Automatically set to false after timeout
        setTimeout(() => {
          broadcastTypingStatus(false)
        }, TYPING_TIMEOUT)
      }, DEBOUNCE_DELAY)
    }
  }, [broadcastTypingStatus])

  // Format typing users message
  const getTypingMessage = useCallback(() => {
    const users = Object.values(typingUsers)
    if (users.length === 0) return ''
    
    if (users.length === 1) {
      return `${users[0].email} is typing...`
    } else if (users.length === 2) {
      return `${users[0].email} and ${users[1].email} are typing...`
    } else {
      return `${users.length} people are typing...`
    }
  }, [typingUsers])

  return {
    typingUsers,
    broadcastTypingStatus: debouncedBroadcast(),
    getTypingMessage
  }
} 