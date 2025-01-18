export default function ChatMessageList({ messages, loading }) {
<<<<<<< HEAD
  if (loading) {
    return (
      <div className="flex-1 p-4 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading messages...</div>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 p-4 flex items-center justify-center">
        <div className="text-gray-500">No messages yet. Start the conversation!</div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-4 overflow-y-auto space-y-4">
      {messages.map(message => (
        <div key={message.id} className="message">
          <div className="p-3 bg-gray-100 rounded-lg">
            <div className="flex justify-between items-start mb-1">
              <span className="text-sm text-gray-600">User {message.user_id}</span>
              <span className="text-xs text-gray-500">
                {new Date(message.created_at).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-gray-800">{message.content}</p>
          </div>
=======
  if (loading) return <div className="flex-1 p-4">Loading...</div>

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {messages.map(message => (
        <div key={message.id} className="mb-4">
          <p className="bg-gray-100 p-2 rounded">{message.content}</p>
          <small className="text-gray-500">
            {new Date(message.created_at).toLocaleTimeString()}
          </small>
>>>>>>> feature/infra
        </div>
      ))}
    </div>
  )
} 