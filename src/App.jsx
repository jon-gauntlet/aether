import React, { useRef, useEffect, useCallback, useState } from 'react'
import ErrorBoundary from './ui/components/ErrorBoundary'
import { LoadingProvider } from './ui/components/LoadingProvider'
import ToastContainer, { setToastContainer, showToast } from './ui/components/ToastContainer'
import Message from './ui/components/Message'
import Input from './ui/components/Input'
import LoadingSpinner from './ui/components/LoadingSpinner'
import ConnectionStatus from './ui/components/ConnectionStatus'
import TypingIndicator from './ui/components/TypingIndicator'
import { useLoading } from './ui/components/LoadingProvider'
import useRealTimeUpdates from './hooks/useRealTimeUpdates'
import useMessageHistory from './hooks/useMessageHistory'
import useKeyboardNavigation from './hooks/useKeyboardNavigation'
import config from './config'

function Chat() {
  const { isLoading, withLoading } = useLoading()
  const messagesEndRef = useRef(null)
  const messageContainerRef = useRef(null)
  const inputRef = useRef(null)
  const [isTyping, setIsTyping] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState(null)
  
  const {
    messages,
    addMessage,
    handleRealTimeMessage,
    loadMoreMessages,
    isLoadingHistory,
    hasMore
  } = useMessageHistory()

  const { isConnected, sendMessage, reconnectAttempts } = useRealTimeUpdates(
    config.api.wsUrl,
    {
      onMessage: (data) => {
        if (data.type === 'typing') {
          setIsTyping(data.isTyping)
        } else {
          handleRealTimeMessage(data)
          setIsTyping(false)
        }
      }
    }
  )

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (!isLoadingHistory) {
      scrollToBottom()
    }
  }, [messages, isLoadingHistory, scrollToBottom])

  const handleScroll = useCallback((e) => {
    const { scrollTop } = e.currentTarget
    if (scrollTop === 0 && hasMore && !isLoadingHistory) {
      loadMoreMessages()
    }
  }, [hasMore, isLoadingHistory, loadMoreMessages])

  const handleReplyToMessage = useCallback((message) => {
    setSelectedMessage(message)
    inputRef.current?.focus()
  }, [])

  const handleEscape = useCallback(() => {
    setSelectedMessage(null)
    inputRef.current?.blur()
  }, [])

  useKeyboardNavigation({
    messageContainerRef,
    messages,
    onReplyToMessage: handleReplyToMessage,
    onScrollToBottom: scrollToBottom,
    onEscape: handleEscape
  })

  const handleSubmit = async (message) => {
    try {
      // Optimistically add user message
      const userMessage = {
        content: message,
        role: 'user',
        replyTo: selectedMessage?.id
      }
      addMessage(userMessage)
      setSelectedMessage(null)

      await withLoading('send-message', async () => {
        const success = await sendMessage({ 
          type: 'message', 
          content: message,
          replyTo: selectedMessage?.id
        })
        if (!success) {
          throw new Error('Failed to send message')
        }
      })
    } catch (error) {
      showToast({
        message: 'Failed to send message. Please try again.',
        type: 'error'
      })
    }
  }

  return (
    <div 
      className="flex flex-col h-screen"
      role="main"
      aria-label="Chat interface"
    >
      <header 
        className="bg-white border-b p-4 shadow-sm"
        role="banner"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold">Aether Chat</h1>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {messages.length} messages
              </span>
              <div className="h-4 w-px bg-gray-300" />
              <div className="text-sm">
                <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">↑</kbd>
                <span className="mx-1 text-gray-500">to navigate</span>
                <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">R</kbd>
                <span className="mx-1 text-gray-500">to reply</span>
              </div>
            </div>
          </div>
          <ConnectionStatus 
            isConnected={isConnected}
            reconnectAttempts={reconnectAttempts}
          />
        </div>
      </header>

      <main 
        ref={messageContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
        role="log"
        aria-label="Message history"
        aria-live="polite"
      >
        {isLoadingHistory && (
          <div 
            className="flex justify-center py-4"
            role="status"
            aria-label="Loading message history"
          >
            <LoadingSpinner size="md" color="blue" />
          </div>
        )}
        
        {messages.map((message) => (
          <Message
            key={message.id}
            content={message.content}
            role={message.role}
            timestamp={message.timestamp}
            replyTo={message.replyTo}
            isSelected={selectedMessage?.id === message.id}
            onReply={() => handleReplyToMessage(message)}
            aria-label={`${message.role} message: ${message.content}`}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'r' && (e.metaKey || e.ctrlKey)) {
                handleReplyToMessage(message)
              }
            }}
          />
        ))}
        
        {isTyping && (
          <TypingIndicator className="ml-4" />
        )}
        
        <div ref={messagesEndRef} tabIndex={-1} />
      </main>

      <footer 
        className="p-4 border-t bg-white shadow-lg"
        role="contentinfo"
      >
        <div className="max-w-4xl mx-auto">
          {selectedMessage && (
            <div className="mb-2 p-2 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Replying to:</span>
                <span className="font-medium truncate max-w-[300px]">
                  {selectedMessage.content}
                </span>
              </div>
              <button
                onClick={handleEscape}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Cancel reply"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <Input
            ref={inputRef}
            onSubmit={handleSubmit}
            isLoading={isLoading('send-message')}
            maxLength={2000}
            aria-label="Message input"
            placeholder={
              isConnected 
                ? "Type a message... (Cmd/Ctrl + / to focus)" 
                : "Reconnecting to server..."
            }
            disabled={!isConnected}
          />
          <div className="mt-2 text-xs text-gray-500 flex justify-between">
            <div>
              Press <kbd className="px-1 py-0.5 bg-gray-100 rounded">Cmd/Ctrl + /</kbd> to focus
            </div>
            <div>
              Press <kbd className="px-1 py-0.5 bg-gray-100 rounded">Cmd/Ctrl + Enter</kbd> to send
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function App() {
  const toastContainerRef = useRef(null)

  useEffect(() => {
    if (toastContainerRef.current) {
      setToastContainer(toastContainerRef.current)
    }
  }, [])

  return (
    <ErrorBoundary>
      <LoadingProvider>
        <div 
          className="min-h-screen bg-gray-50"
          role="application"
          aria-label="Aether Chat Application"
        >
          <Chat />
          <ToastContainer 
            ref={toastContainerRef}
            role="alert"
            aria-live="assertive"
          />
        </div>
      </LoadingProvider>
    </ErrorBoundary>
  )
}

export default App 