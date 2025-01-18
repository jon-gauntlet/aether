import { memo, useEffect, useCallback } from 'react'
import { measureRender } from '../utils/performance'
import FormattedMessage from './FormattedMessage'

function Message({ message, onRead }) {
  const { 
    text, 
    status, 
    user_email, 
    user_id, 
    attachments = [], 
    read_receipts = [] 
  } = message

  // Mark message as read when rendered
  useEffect(() => {
    if (onRead && !read_receipts.includes(user_id)) {
      onRead(message)
    }
  }, [message, onRead, user_id, read_receipts])

  // Memoize attachment rendering
  const renderAttachments = useCallback(() => {
    if (!attachments.length) return null

    return attachments.map((attachment) => {
      if (attachment.type.startsWith('image/')) {
        return (
          <img
            key={attachment.id}
            src={attachment.url}
            alt={attachment.name}
            className="max-w-[200px] max-h-[200px] rounded-lg"
          />
        )
      }
      return (
        <a
          key={attachment.id}
          href={attachment.url}
          className="text-blue-500 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {attachment.name}
        </a>
      )
    })
  }, [attachments])

  // Memoize status rendering
  const renderStatus = useCallback(() => {
    if (!status) return null

    switch (status) {
      case 'sending':
        return <span className="text-gray-400">Sending...</span>
      case 'sent':
        return <span className="text-gray-400">Sent</span>
      case 'delivered':
        return <span className="text-gray-400">Delivered</span>
      default:
        return null
    }
  }, [status])

  const isOwnMessage = user_id === 'current_user' // Replace with actual user ID check

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] break-words rounded-lg px-4 py-2 ${
        isOwnMessage ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
      }`}>
        {!isOwnMessage && (
          <div className="text-xs text-gray-500 mb-1">{user_email}</div>
        )}
        <FormattedMessage content={text} />
        {renderAttachments()}
        <div className="text-xs mt-1">
          {renderStatus()}
          {read_receipts.length > 0 && (
            <span className="ml-2">
              Read {read_receipts.length > 1 ? `by ${read_receipts.length}` : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// Wrap with performance monitoring and memoization
export default measureRender(memo(Message)) 