export default function ChatMessageList({ messages, loading }) {
  if (loading) return <div className="flex-1 p-4">Loading...</div>

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {messages.map(message => (
        <div key={message.id} className="mb-4">
          <p className="bg-gray-100 p-2 rounded">{message.content}</p>
          <small className="text-gray-500">
            {new Date(message.created_at).toLocaleTimeString()}
          </small>
        </div>
      ))}
    </div>
  )
} 