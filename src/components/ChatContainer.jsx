import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import ChatInput from './ChatInput'
import ChatMessageList from './ChatMessageList'

export default function ChatContainer() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    loadMessages()
    
    const channel = supabase
      .channel('messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' },
        payload => {
          setMessages(current => [...current, payload.new])
        }
      )
      .subscribe(status => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function loadMessages() {
    try {
      setError(null)
      const { data, error: loadError } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })

      if (loadError) throw loadError
      setMessages(data)
    } catch (err) {
      setError('Failed to load messages')
      console.error('Error loading messages:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSendMessage(content) {
    try {
      setError(null)
      const { error: sendError } = await supabase
        .from('messages')
        .insert([{ content, user_id: 'anonymous' }])

      if (sendError) throw sendError
    } catch (err) {
      setError('Failed to send message')
      console.error('Error sending message:', err)
    }
  }

  return (
    <div className="flex flex-col h-[600px] border rounded-lg bg-white shadow-sm">
      {error && (
        <div className="p-2 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}
      <div className="p-2 border-b text-sm text-gray-500">
        {isConnected ? (
          <span className="text-green-600">●</span>
        ) : (
          <span className="text-red-600">●</span>
        )} {isConnected ? 'Connected' : 'Connecting...'}
      </div>
      <ChatMessageList messages={messages} loading={loading} />
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  )
} 