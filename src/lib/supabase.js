import { createClient } from '@supabase/supabase-js'
import { logger } from './logger'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Get messages with pagination and efficient ordering
export const getMessages = async (limit = 50, before = null) => {
  try {
    let query = supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (before) {
      query = query.lt('created_at', before)
    }

    const { data, error } = await query
    
    if (error) throw error
    return data.reverse()
  } catch (error) {
    logger.error('Failed to fetch messages', error)
    return []
  }
}

// Send message with error handling
export const sendMessage = async (content, userId = null) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({ content, user_id: userId })
      .select()
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    logger.error('Failed to send message', error)
    return null
  }
}

// Get chat statistics
export const getChatStats = async () => {
  try {
    const { data, error } = await supabase
      .from('mv_chat_stats')
      .select('*')
      .order('hour', { ascending: false })
      .limit(24)
    
    if (error) throw error
    return data
  } catch (error) {
    logger.error('Failed to fetch chat stats', error)
    return []
  }
}

// Real-time subscription with error handling
export const onNewMessage = (onMessage, onStatus = () => {}) => {
  try {
    const channel = supabase.channel('messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' }, 
        payload => {
          try {
            onMessage(payload.new)
          } catch (error) {
            logger.error('Error in message handler', error)
          }
        }
      )
      .subscribe(status => {
        try {
          onStatus(status === 'SUBSCRIBED')
        } catch (error) {
          logger.error('Error in status handler', error)
        }
      })
      
    return () => {
      try {
        supabase.removeChannel(channel)
      } catch (error) {
        logger.error('Error removing channel', error)
      }
    }
  } catch (error) {
    logger.error('Failed to setup message subscription', error)
    return () => {}
  }
} 