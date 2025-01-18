import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function ChatContainer() {
  const { user, logout } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [channel, setChannel] = useState('general')

  useEffect(() => {
    if (!user) return
    // Load messages for the current channel
  }, [channel, user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !user) return

    // Send message logic here
    setNewMessage('')
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  if (!user) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <p className="text-lg">Please log in to access the chat.</p>
      </div>
    )
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="channel-select">
          <select
            data-testid="channel-select"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
          >
            <option value="general">General</option>
            <option value="random">Random</option>
          </select>
        </div>
        <button data-testid="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
      <div className="messages">
        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div key={msg.id || index} className="message">
              <strong>{msg.user}:</strong> {msg.text}
            </div>
          ))}
        </div>
      </div>
      <form className="chat-input" onSubmit={handleSubmit}>
        <input
          type="text"
          data-testid="message-input"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button
          type="submit"
          data-testid="send-button"
          disabled={!newMessage.trim()}
        >
          Send
        </button>
      </form>
    </div>
  )
} 