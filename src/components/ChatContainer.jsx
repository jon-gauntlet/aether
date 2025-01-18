import { useEffect, useState } from 'react'
<<<<<<< HEAD
import { supabase } from '../supabaseClient'
=======
import { supabase } from '../lib/supabaseClient'
>>>>>>> feature/infra
import ChatInput from './ChatInput'
import ChatMessageList from './ChatMessageList'

export default function ChatContainer() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
<<<<<<< HEAD
  const [error, setError] = useState(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    loadMessages()
    
=======

  useEffect(() => {
    // Load initial messages
    loadMessages()
    
    // Subscribe to new messages
>>>>>>> feature/infra
    const channel = supabase
      .channel('messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' },
        payload => {
          setMessages(current => [...current, payload.new])
        }
      )
<<<<<<< HEAD
      .subscribe(status => {
        setIsConnected(status === 'SUBSCRIBED')
      })
=======
      .subscribe()
>>>>>>> feature/infra

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function loadMessages() {
    try {
<<<<<<< HEAD
      setError(null)
      const { data, error: loadError } = await supabase
=======
      const { data, error } = await supabase
>>>>>>> feature/infra
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })

<<<<<<< HEAD
      if (loadError) throw loadError
      setMessages(data)
    } catch (err) {
      setError('Failed to load messages')
      console.error('Error loading messages:', err)
=======
      if (error) throw error
      setMessages(data)
    } catch (error) {
      console.error('Error loading messages:', error)
>>>>>>> feature/infra
    } finally {
      setLoading(false)
    }
  }

  async function handleSendMessage(content) {
    try {
<<<<<<< HEAD
      setError(null)
      const { error: sendError } = await supabase
        .from('messages')
        .insert([{ content, user_id: 'anonymous' }])

      if (sendError) throw sendError
    } catch (err) {
      setError('Failed to send message')
      console.error('Error sending message:', err)
=======
      const { error } = await supabase
        .from('messages')
        .insert([{ content }])

      if (error) throw error
    } catch (error) {
      console.error('Error sending message:', error)
>>>>>>> feature/infra
    }
  }

  return (
<<<<<<< HEAD
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
=======
    <div className="flex flex-col h-screen">
>>>>>>> feature/infra
      <ChatMessageList messages={messages} loading={loading} />
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  )
} 