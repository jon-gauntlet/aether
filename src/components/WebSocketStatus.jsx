import React, { useState, useEffect, useCallback } from 'react'
import useWebSocket from '../hooks/useWebSocket'

const WebSocketStatus = ({ url = 'ws://localhost:8000' }) => {
  const { 
    isConnected, 
    lastMessage, 
    sendMessage, 
    activeUsers,
    typingUsers,
    sendTypingUpdate,
    messageDelivery,
    markMessagesAsRead,
    getMessageReadStatus,
    readReceipts
  } = useWebSocket(url)
  const [messageInput, setMessageInput] = useState('')
  const [messages, setMessages] = useState([])

  useEffect(() => {
    if (lastMessage && lastMessage.type === 'message') {
      setMessages(prev => [...prev, lastMessage])
      // Mark message as read when received
      if (lastMessage.id) {
        markMessagesAsRead(lastMessage.id)
      }
    }
  }, [lastMessage, markMessagesAsRead])

  const handleInputChange = useCallback((e) => {
    const value = e.target.value
    setMessageInput(value)
    sendTypingUpdate(value.length > 0)
  }, [sendTypingUpdate])

  const handleSend = (e) => {
    e.preventDefault()
    if (!messageInput.trim()) return

    const message = {
      type: 'message',
      data: messageInput,
      timestamp: new Date().toISOString()
    }

    sendMessage(message)
    setMessageInput('')
    sendTypingUpdate(false)
  }

  const getDeliveryStatus = (messageId) => {
    const delivery = messageDelivery.get(messageId)
    if (!delivery) return null
    return {
      icon: delivery.status === 'delivered' ? '✓✓' : '✓',
      time: delivery.deliveryTime ? `${Math.round(delivery.deliveryTime)}ms` : null
    }
  }

  const getReadStatus = (messageId) => {
    const status = getMessageReadStatus(messageId)
    if (!status) return null

    return {
      icon: status.isRead ? '👁️' : null,
      readBy: status.readBy,
      isUnread: status.isUnread
    }
  }

  return (
    <div className="p-4 max-w-4xl mx-auto grid grid-cols-4 gap-4">
      {/* Active Users Sidebar */}
      <div className="col-span-1 border rounded-lg p-4 bg-gray-50">
        <h2 className="font-medium mb-4">Active Users</h2>
        {activeUsers.length === 0 ? (
          <div className="text-gray-500">No active users</div>
        ) : (
          <ul className="space-y-2">
            {activeUsers.map(([userId, data]) => (
              <li key={userId} className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  data.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'
                }`} />
                <div>
                  <div className="font-medium">
                    {userId}
                    {typingUsers.includes(userId) && (
                      <span className="ml-2 text-gray-500 text-sm animate-pulse">
                        typing...
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    Last seen: {new Date(data.lastSeen).toLocaleTimeString()}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="col-span-3">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className="font-medium">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          {typingUsers.length > 0 && (
            <div className="text-sm text-gray-500 animate-pulse">
              {typingUsers.length === 1
                ? `${typingUsers[0]} is typing...`
                : `${typingUsers.length} people are typing...`}
            </div>
          )}
        </div>

        <div className="mb-4 border rounded-lg p-4 h-96 overflow-y-auto bg-gray-50">
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`mb-2 p-2 bg-white rounded shadow ${
                msg.id && getReadStatus(msg.id)?.isUnread ? 'border-l-4 border-blue-500' : ''
              }`}
            >
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                {msg.id && (
                  <div className="flex items-center space-x-2">
                    {getDeliveryStatus(msg.id)?.time && (
                      <span className="text-xs text-gray-400">
                        {getDeliveryStatus(msg.id).time}
                      </span>
                    )}
                    <div className="flex items-center space-x-1">
                      <span className={`${
                        getDeliveryStatus(msg.id)?.icon === '✓✓' 
                          ? 'text-green-500' 
                          : 'text-gray-400'
                      }`}>
                        {getDeliveryStatus(msg.id)?.icon || '✓'}
                      </span>
                      {getReadStatus(msg.id)?.icon && (
                        <span 
                          className="text-blue-500 cursor-help"
                          title={`Read by: ${getReadStatus(msg.id).readBy.join(', ')}`}
                        >
                          {getReadStatus(msg.id).icon}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-1">{msg.data}</div>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="text-gray-500 text-center mt-20">
              No messages yet
            </div>
          )}
        </div>

        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={messageInput}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border rounded"
            disabled={!isConnected}
          />
          <button
            type="submit"
            disabled={!isConnected || !messageInput.trim()}
            className={`px-4 py-2 rounded font-medium ${
              isConnected && messageInput.trim()
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}

export default WebSocketStatus 