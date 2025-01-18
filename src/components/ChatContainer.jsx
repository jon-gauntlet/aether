import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import ChatInput from './ChatInput'
import ChatMessageList from './ChatMessageList'

export default function ChatContainer() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load initial messages
    loadMessages()
    
    // Subscribe to new messages
    const channel = supabase
      .channel('messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' },
        payload => {
          setMessages(current => [...current, payload.new])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function loadMessages() {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data)
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSendMessage(content) {
    try {
      const { error } = await supabase
        .from('messages')
        .insert([{ content }])

      if (error) throw error
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <ChatMessageList messages={messages} loading={loading} />
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  )
} 