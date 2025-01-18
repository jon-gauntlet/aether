import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'

export function useOnlineUsers() {
  const [onlineUsers, setOnlineUsers] = useState([])

  useEffect(() => {
    // Subscribe to presence changes
    const channel = supabase.channel('online-users')
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState()
        const users = Object.values(newState).flat()
        setOnlineUsers(users)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ 
            user_id: supabase.auth.user()?.id,
            email: supabase.auth.user()?.email,
            online_at: new Date().toISOString()
          })
        }
      })

    return () => {
      channel.unsubscribe()
    }
  }, [])

  return onlineUsers
} 