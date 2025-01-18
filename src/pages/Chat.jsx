import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react'
import ChatErrorBoundary from '../components/ChatErrorBoundary'
import { useMessages } from '../hooks/useMessages'
import { useTypingStatus } from '../hooks/useTypingStatus'

// Lazy load components
const MessageList = lazy(() => import('../components/MessageList'))
const ChatInput = lazy(() => import('../components/ChatInput'))
const TypingIndicator = lazy(() => import('../components/TypingIndicator'))

// Loading fallback components
const MessageListFallback = () => (
  <div className="flex-1 p-4 space-y-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="flex items-start space-x-4">
        <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    ))}
  </div>
)

const ChatInputFallback = () => (
  <div className="p-4 border-t border-gray-200">
    <div className="h-10 bg-gray-200 rounded animate-pulse" />
  </div>
)

const TypingIndicatorFallback = () => (
  <div className="h-6 px-4">
    <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
  </div>
)

function Chat() {
  const { messages, sendMessage, markRead, error, isLoading } = useMessages()
  const { typingUsers } = useTypingStatus()
  const [activeThread, setActiveThread] = useState(null)
  const [threadMessages, setThreadMessages] = useState([])
  const messagesEndRef = useRef(null)

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: smooth ? 'smooth' : 'auto',
      block: 'end'
    })
  }, [])

  useEffect(() => {
    if (!activeThread) {
      scrollToBottom()
    }
  }, [messages, activeThread, scrollToBottom])

  // Handle message read status
  const handleMessageRead = useCallback((messageId) => {
    markRead(messageId)
  }, [markRead])

  // Handle thread selection
  const handleThreadClick = useCallback(async (messageId) => {
    try {
      setActiveThread(messageId)
      // TODO: Fetch thread messages from backend
      const threadMsgs = messages.filter(m => m.threadId === messageId || m.id === messageId)
      setThreadMessages(threadMsgs)
    } catch (err) {
      throw new Error(`Failed to load thread: ${err.message}`)
    }
  }, [messages])

  // Handle thread reply
  const handleThreadReply = useCallback(async (text) => {
    if (!activeThread) return
    try {
      await sendMessage(text, { threadId: activeThread })
      scrollToBottom()
    } catch (err) {
      throw new Error(`Failed to send thread reply: ${err.message}`)
    }
  }, [activeThread, sendMessage, scrollToBottom])

  if (error) {
    throw new Error(`Failed to load messages: ${error}`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading messages...</div>
      </div>
    )
  }

  return (
    <ChatErrorBoundary>
      <div className="flex h-full">
        <div className={`flex flex-col flex-1 ${activeThread ? 'w-7/12' : 'w-full'} transition-all duration-300`}>
          <div className="flex-1 relative">
            <Suspense fallback={<MessageListFallback />}>
              <MessageList 
                messages={messages}
                onMessageRead={handleMessageRead}
                onThreadClick={handleThreadClick}
              />
            </Suspense>
            <Suspense fallback={<TypingIndicatorFallback />}>
              <TypingIndicator typingUsers={typingUsers} />
            </Suspense>
            <div ref={messagesEndRef} />
          </div>
          <Suspense fallback={<ChatInputFallback />}>
            <ChatInput 
              onSendMessage={async (message) => {
                try {
                  await sendMessage(message.text)
                } catch (err) {
                  throw new Error(`Failed to send message: ${err.message}`)
                }
              }}
            />
          </Suspense>
        </div>

        {activeThread && (
          <div className="w-5/12 flex flex-col border-l border-gray-200 bg-gray-50">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Thread</h2>
              <button 
                onClick={() => setActiveThread(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="sr-only">Close thread</span>
                ×
              </button>
            </div>
            <div className="flex-1 relative">
              <Suspense fallback={<MessageListFallback />}>
                <MessageList 
                  messages={threadMessages}
                  onMessageRead={handleMessageRead}
                />
              </Suspense>
              <div ref={messagesEndRef} />
            </div>
            <Suspense fallback={<ChatInputFallback />}>
              <ChatInput 
                onSendMessage={async (message) => {
                  try {
                    await handleThreadReply(message.text)
                  } catch (err) {
                    throw new Error(`Failed to send thread reply: ${err.message}`)
                  }
                }}
                placeholder="Reply to thread..."
              />
            </Suspense>
          </div>
        )}
      </div>
    </ChatErrorBoundary>
  )
}

export default Chat 