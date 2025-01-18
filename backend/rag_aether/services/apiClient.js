import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export const fetchMessages = async (channel = 'general') => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('channel', channel)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
};

export const sendMessage = async (message, channel = 'general') => {
  const { data, error } = await supabase
    .from('messages')
    .insert([{ content: message, channel }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const subscribeToMessages = (channel, callback) => {
  return supabase
    .channel(`messages:${channel}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `channel=eq.${channel}`,
      },
      callback
    )
    .subscribe();
};

export default {
  fetchMessages,
  sendMessage,
  subscribeToMessages,
  supabase,
}; 