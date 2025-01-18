import { useState, useEffect } from 'react'
import config from '../config'
import { supabase } from '../services/supabase'

const API_URL = config.api.baseUrl

// Error handling
class APIError extends Error {
  constructor(message, status, data) {
    super(message)
    this.status = status
    this.data = data
    this.name = 'APIError'
  }
}

// Query hook
export function useQuery({ queryKey, queryFn, onError }) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await queryFn()
        setData(result)
      } catch (error) {
        onError?.(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [queryKey.join(',')])

  return { data, isLoading }
}

// Mutation hook
export function useMutation({ mutationFn, onSuccess, onError }) {
  const [isLoading, setIsLoading] = useState(false)

  const mutate = async (...args) => {
    setIsLoading(true)
    try {
      const result = await mutationFn(...args)
      onSuccess?.(result)
      return result
    } catch (error) {
      onError?.(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return { mutate, isLoading }
}

// API Client
export const apiClient = {
  // Fetch messages
  async fetchMessages(channel) {
    // Check auth state first
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw new APIError('Not authenticated', 401)
    }

    console.log('Fetching messages for channel:', channel)
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('channel', channel)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Supabase error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      throw new APIError(
        error.message || 'Failed to fetch messages',
        error.code === 'PGRST116' ? 400 : 500,
        error
      )
    }
    console.log('Fetched messages:', data)
    return data || []
  },

  // Send message
  async sendMessage(content, channel) {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw new APIError('Failed to get user', 401, userError)
    if (!user) throw new APIError('Not authenticated', 401)

    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          content,
          channel,
          user_id: user.id,
          coherence_level: 0,
          energy_level: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      throw new APIError(error.message || 'Failed to send message', error.code === 'PGRST116' ? 400 : 500, error)
    }
    return data
  },

  // Upload file
  async uploadFile(file, channel) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('channel', channel)

    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: formData
    })
    if (!response.ok) throw new APIError('Failed to upload file', response.status)
    return response.json()
  }
}

// Convenience exports
export const { fetchMessages, sendMessage, uploadFile } = apiClient

// Message subscription
export function subscribeToMessages(channel, onMessage) {
  const subscription = supabase
    .channel(`messages:${channel}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `channel=eq.${channel}`
      },
      (payload) => onMessage(payload.new)
    )
    .subscribe()

  return {
    unsubscribe: () => {
      subscription.unsubscribe()
    }
  }
} 