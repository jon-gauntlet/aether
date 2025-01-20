import { supabase } from './supabaseClient'
import { PERFORMANCE } from '../config/constants'

// Channel types
export const CHANNELS = {
  FILES: 'files',
  AUTH: 'auth',
  STORAGE: 'storage'
}

// Event types
export const EVENTS = {
  INSERT: 'INSERT',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  ERROR: 'ERROR'
}

class RealtimeClient {
  constructor() {
    this.subscriptions = new Map()
    this.retryAttempts = new Map()
    this.maxRetries = PERFORMANCE.retryAttempts
    this.retryDelay = PERFORMANCE.retryDelay
  }

  // Subscribe to channel with retry logic
  subscribe(channelName, filter = {}, callbacks = {}) {
    const retryCount = this.retryAttempts.get(channelName) || 0

    try {
      // Create channel with filter
      const channel = supabase.channel(`${channelName}:${Date.now()}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: channelName,
          ...filter
        }, (payload) => {
          // Reset retry count on successful message
          this.retryAttempts.set(channelName, 0)

          // Handle different event types
          switch (payload.eventType) {
            case EVENTS.INSERT:
              callbacks.onInsert?.(payload.new)
              break
            case EVENTS.UPDATE:
              callbacks.onUpdate?.(payload.new, payload.old)
              break
            case EVENTS.DELETE:
              callbacks.onDelete?.(payload.old)
              break
            default:
              console.warn('Unknown event type:', payload.eventType)
          }
        })
        .on('error', (error) => {
          console.error(`Channel ${channelName} error:`, error)
          callbacks.onError?.(error)

          // Attempt retry if under max attempts
          if (retryCount < this.maxRetries) {
            this.retryAttempts.set(channelName, retryCount + 1)
            setTimeout(() => {
              console.log(`Retrying ${channelName} subscription...`)
              this.subscribe(channelName, filter, callbacks)
            }, this.retryDelay * Math.pow(2, retryCount)) // Exponential backoff
          } else {
            console.error(`Max retries reached for ${channelName}`)
            callbacks.onMaxRetries?.()
          }
        })
        .subscribe()

      // Store subscription
      this.subscriptions.set(channelName, {
        channel,
        filter,
        callbacks
      })

      return () => this.unsubscribe(channelName)
    } catch (error) {
      console.error(`Failed to subscribe to ${channelName}:`, error)
      callbacks.onError?.(error)
      return () => {}
    }
  }

  // Unsubscribe from channel
  unsubscribe(channelName) {
    const subscription = this.subscriptions.get(channelName)
    if (subscription) {
      try {
        subscription.channel.unsubscribe()
        this.subscriptions.delete(channelName)
        this.retryAttempts.delete(channelName)
      } catch (error) {
        console.error(`Failed to unsubscribe from ${channelName}:`, error)
      }
    }
  }

  // Subscribe to file changes
  subscribeToFiles(folderId, callbacks) {
    return this.subscribe(CHANNELS.FILES, {
      filter: `folder_id=eq.${folderId}`
    }, callbacks)
  }

  // Subscribe to storage events
  subscribeToStorage(bucket, callbacks) {
    return this.subscribe(CHANNELS.STORAGE, {
      filter: `bucket=eq.${bucket}`
    }, callbacks)
  }

  // Subscribe to auth events
  subscribeToAuth(userId, callbacks) {
    return this.subscribe(CHANNELS.AUTH, {
      filter: `user_id=eq.${userId}`
    }, callbacks)
  }

  // Unsubscribe from all channels
  unsubscribeAll() {
    for (const channelName of this.subscriptions.keys()) {
      this.unsubscribe(channelName)
    }
  }
}

// Create singleton instance
const realtimeClient = new RealtimeClient()

// Clean up on window unload
window.addEventListener('unload', () => {
  realtimeClient.unsubscribeAll()
})

export default realtimeClient 