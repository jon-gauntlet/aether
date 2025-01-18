import { useEffect, useRef } from 'react'
import { useMessages } from '../hooks/useMessages'
import { useNotifications } from '../contexts/NotificationContext'
import MessageList from './MessageList'
import ChatInput from './ChatInput'
import TypingIndicator from './TypingIndicator'

function ChatContainer() {
  const { messages, sendMessage, markRead, error, isLoading, isOnline } = useMessages()
  const { addNotification } = useNotifications()
  const bottomRef = useRef(null)

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  useEffect(() => {
    if (!isOnline) {
      addNotification({
        type: 'warning',
        title: 'You are offline',
        message: 'Messages will be sent when you reconnect',
        duration: null // Don't auto-dismiss
      })
    } else {
      addNotification({
        type: 'success',
        title: 'Connected',
        message: 'You are back online',
        duration: 3000
      })
    }
  }, [isOnline, addNotification])

  const handleSend = async (text) => {
    try {
      await sendMessage(text)
    } catch (err) {
      // Error is already handled in useMessages
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="text-red-500 mb-4">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-gray-700">Failed to load messages</p>
        <p className="text-sm text-gray-500 mt-1">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {!isOnline && (
        <div className="bg-yellow-50 border-b border-yellow-100 px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-yellow-700">
                You are currently offline. Messages will be sent when you reconnect.
              </span>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : (
          <MessageList messages={messages} onMessageRead={markRead} />
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-gray-200 p-4">
        <ChatInput onSend={handleSend} disabled={isLoading} />
      </div>
    </div>
  )
}

export default ChatContainer 