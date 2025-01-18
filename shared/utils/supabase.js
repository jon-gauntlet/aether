import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Auth helpers
export const signInWithEmail = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
  });
  if (error) throw error;
  return data;
};

export const signUp = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Message persistence helpers
export const saveMessage = async (message) => {
  const { data, error } = await supabase
    .from('messages')
    .insert([
      {
        content: message.content,
        username: message.username,
        channel: message.channel,
        timestamp: message.timestamp,
      },
    ])
    .select();
  if (error) throw error;
  return data[0];
};

export const getChannelMessages = async (channel, limit = 50) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('channel', channel)
    .order('timestamp', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data.reverse();
};

// Real-time subscription for new messages
export const subscribeToMessages = (channel, callback) => {
  return supabase
    .channel(`messages:${channel}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `channel=eq.${channel}`,
      },
      (payload) => callback(payload.new)
    )
    .subscribe();
}; 