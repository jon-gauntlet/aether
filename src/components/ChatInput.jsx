import { useState } from 'react'

export default function ChatInput({ onSendMessage }) {
  const [message, setMessage] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!message.trim()) return
    
    onSendMessage(message)
    setMessage('')
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t">
      <input
        type="text"
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Type a message..."
        className="w-full p-2 border rounded"
      />
    </form>
  )
} 