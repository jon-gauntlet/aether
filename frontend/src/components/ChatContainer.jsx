import React, { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'

const ChatMessageList = ({ messages }) => (
  <div className="chat-messages">
    {messages.map((message, index) => (
      <div key={`${message.id || message.timestamp || index}`} className="message">
        <strong>{message.sender}: </strong>
        {message.content}
      </div>
    ))}
  </div>
);

function ChatInput({ onSendMessage, isLoading }) {
  const [message, setMessage] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (message.trim()) {
      onSendMessage(message)
      setMessage('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="chat-input">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        disabled={isLoading}
        data-testid="message-input"
      />
      <button 
        type="submit" 
        disabled={isLoading || !message.trim()}
        data-testid="send-button"
      >
        Send
      </button>
    </form>
  )
}

export function ChatContainer() {
  const [messages, setMessages] = useState([])
  const [channel, setChannel] = useState('general')
  const [error, setError] = useState(null)
  const { user, loading, logout } = useAuth()

  useEffect(() => {
    if (!user) return

    // Load initial messages
    const loadMessages = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        const response = await fetch(`/api/messages/${channel}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (!response.ok) throw new Error('Failed to load messages')
        const data = await response.json()
        setMessages(data)
      } catch (err) {
        setError('Failed to load messages')
      }
    }

    loadMessages()

    // Set up WebSocket connection
    const token = localStorage.getItem('auth_token')
    const ws = new WebSocket(`ws://localhost:8000/ws/${channel}?token=${token}`)
    
    ws.onmessage = (event) => {
      const newMessage = JSON.parse(event.data)
      setMessages(prev => [...prev, newMessage])
    }

    return () => {
      ws.close()
    }
  }, [channel, user])

  const handleSendMessage = useCallback(async (content) => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content,
          channel,
          username: user.email,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }
    } catch (err) {
      setError('Failed to send message')
    }
  }, [channel, user])

  const handleChannelChange = (e) => {
    setChannel(e.target.value)
  }

  const handleLogout = async () => {
    await logout()
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <div>Please log in to access the chat.</div>
  }

  return (
    <div className="chat-container" data-testid="chat-container">
      <div className="chat-header">
        <div className="channel-select">
          <select 
            value={channel} 
            onChange={handleChannelChange}
            data-testid="channel-select"
          >
            <option value="general">General</option>
            <option value="random">Random</option>
          </select>
        </div>
        <button onClick={handleLogout} data-testid="logout-button">
          Logout
        </button>
      </div>

      {error && <div className="error" role="alert">{error}</div>}

      <div className="messages">
        <ChatMessageList messages={messages} />
      </div>

      <ChatInput 
        onSendMessage={handleSendMessage}
        isLoading={loading}
      />
    </div>
  )
} 