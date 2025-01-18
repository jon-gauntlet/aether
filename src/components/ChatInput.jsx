import { useState } from 'react'

export default function ChatInput({ onSendMessage }) {
  const [message, setMessage] = useState('')
<<<<<<< HEAD
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmedMessage = message.trim()
    if (!trimmedMessage) return
    
    setIsLoading(true)
    try {
      await onSendMessage(trimmedMessage)
      setMessage('')
    } finally {
      setIsLoading(false)
    }
=======

  function handleSubmit(e) {
    e.preventDefault()
    if (!message.trim()) return
    
    onSendMessage(message)
    setMessage('')
>>>>>>> feature/infra
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t">
<<<<<<< HEAD
      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={isLoading}
          className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          maxLength={500}
        />
        <button 
          type="submit"
          disabled={!message.trim() || isLoading}
          className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </div>
=======
      <input
        type="text"
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Type a message..."
        className="w-full p-2 border rounded"
      />
>>>>>>> feature/infra
    </form>
  )
} 