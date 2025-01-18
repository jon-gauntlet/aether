import { createClient } from '@supabase/supabase-js'
import config from '../config'

if (!config.supabase.url || !config.supabase.anonKey) {
  throw new Error('Missing Supabase configuration. Please check your environment variables.')
}

export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
)

export async function getAuthToken() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token
}

export async function refreshAuthToken() {
  const { data: { session } } = await supabase.auth.refreshSession()
  return session?.access_token
} 