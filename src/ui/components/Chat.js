import React, { useState } from 'react'
import Input from './Input'
import Message from './Message'
import { useRag } from '../hooks/useRag'

function Chat() {
  const [messages, setMessages] = useState([])
  const { query } = useRag()

  const handleSubmit = async content => {
    // Add user message
    const userMessage = {
      id: Date.now(),
      content,
      role: 'user',
    }
    setMessages(prev => [...prev, userMessage])

    // Get response from RAG
    try {
      const response = await query(content)
      const assistantMessage = {
        id: Date.now() + 1,
        content: response,
        role: 'assistant',
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error querying RAG:', error)
      const errorMessage = {
        id: Date.now() + 1,
        content: 'Sorry, there was an error processing your request.',
        role: 'assistant',
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <Message key={message.id} content={message.content} role={message.role} />
        ))}
      </div>
      <div className="p-4 border-t">
        <Input onSubmit={handleSubmit} />
      </div>
    </div>
  )
}

export default Chat
