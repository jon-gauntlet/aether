import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'

export default function ChatContainer() {
  const { user, logout } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [channel, setChannel] = useState('general')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!user) return
    
    const loadMessages = async () => {
      try {
        setLoading(true)
        setError(null)
        // Load messages for the current channel
        // Simulated delay for demo
        await new Promise(resolve => setTimeout(resolve, 1000))
        setMessages([]) // Replace with actual message loading
      } catch (err) {
        setError('Failed to load messages')
        console.error('Error loading messages:', err)
      } finally {
        setLoading(false)
      }
    }

    loadMessages()
  }, [channel, user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !user || sending) return

    try {
      setSending(true)
      // Send message logic here
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulated delay
      const newMsg = {
        id: Date.now(),
        user: user.email,
        text: newMessage,
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, newMsg])
      setNewMessage('')
    } catch (err) {
      setError('Failed to send message')
      console.error('Error sending message:', err)
    } finally {
      setSending(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Error logging out:', error)
      setError('Failed to logout')
    }
  }

  if (!user) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-[300px] flex items-center justify-center"
      >
        <p className="text-lg text-gray-600">Please log in to access the chat.</p>
      </motion.div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg overflow-hidden"
    >
      <div className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <select
            data-testid="channel-select"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="bg-blue-700 text-white px-3 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            disabled={loading}
          >
            <option value="general">💬 General</option>
            <option value="random">🎲 Random</option>
          </select>
          {loading && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
            />
          )}
        </div>
        <button 
          data-testid="logout-button" 
          onClick={handleLogout}
          className="px-3 py-1 bg-blue-700 hover:bg-blue-800 rounded-md transition-colors duration-200"
        >
          Logout
        </button>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4"
            role="alert"
          >
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-gray-500"
            >
              Loading messages...
            </motion.div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No messages in this channel yet
          </div>
        ) : (
          <motion.div layout className="space-y-4">
            {messages.map((msg, index) => (
              <motion.div
                key={msg.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-3 rounded-lg ${
                  msg.user === user.email
                    ? 'bg-blue-100 ml-auto max-w-[80%]'
                    : 'bg-white max-w-[80%]'
                } shadow-sm`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-sm text-blue-800">
                    {msg.user === user.email ? 'You' : msg.user}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-gray-800">{msg.text}</p>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </motion.div>
        )}
      </div>

      <form 
        className="p-4 bg-white border-t"
        onSubmit={handleSubmit}
      >
        <div className="flex space-x-2">
          <input
            type="text"
            data-testid="message-input"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
            disabled={sending}
          />
          <motion.button
            type="submit"
            data-testid="send-button"
            disabled={!newMessage.trim() || sending}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-6 py-2 rounded-full font-medium transition-colors duration-200 ${
              !newMessage.trim() || sending
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {sending ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              'Send'
            )}
          </motion.button>
        </div>
      </form>
    </motion.div>
  )
} 