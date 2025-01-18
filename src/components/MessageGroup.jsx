import { memo, useRef, useEffect } from 'react'
import Message from './Message'

function MessageGroup({ messages, timestamp, onMessageRead }) {
  const groupRef = useRef(null)
  
  // Report actual height to parent for virtualization
  useEffect(() => {
    if (groupRef.current) {
      const height = groupRef.current.getBoundingClientRect().height
      // TODO: Implement dynamic height adjustment callback when needed
    }
  }, [messages])

  return (
    <div ref={groupRef} className="relative">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm py-2 px-4 text-xs text-gray-500 border-b border-gray-100">
        {formatTimestamp(timestamp)}
      </div>
      <div className="space-y-1 py-2 px-4">
        {messages.map((message) => (
          <Message 
            key={message.id}
            message={message}
            onRead={onMessageRead}
          />
        ))}
      </div>
    </div>
  )
}

function formatTimestamp(date) {
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === now.toDateString()) {
    return 'Today'
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  } else {
    const isThisYear = date.getFullYear() === now.getFullYear()
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: isThisYear ? undefined : 'numeric'
    }).format(date)
  }
}

export default memo(MessageGroup) 