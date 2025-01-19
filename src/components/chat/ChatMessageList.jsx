import React, { useState, useEffect, useRef, memo, useCallback, useMemo } from 'react'
import MessageReactions from './MessageReactions'
import { 
  VStack, 
  Box, 
  Text, 
  Skeleton,
  useColorModeValue 
} from '@chakra-ui/react'

// Add unique ID generator
let uniqueId = 0;
const getUniqueId = () => `temp-${Date.now()}-${uniqueId++}`;

const MemoizedMessageGroup = memo(function MessageGroup({ 
  messages, 
  sendingMessages = new Set(),
  onReact = () => {}, 
  userReactions = new Map() 
}) {
  if (!messages || !messages.length) return null;
  
  const firstMessage = messages[0]
  const userId = firstMessage?.user_id || firstMessage?.sender || 'anonymous'
  
  return (
    <div 
      className="flex items-start gap-2 group"
      role="group"
      aria-label={`Messages from ${userId}`}
    >
      <div 
        className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0"
        aria-hidden="true"
      >
        <span className="text-sm text-blue-600">
          {userId.charAt(0).toUpperCase()}
        </span>
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">
            {userId}
          </span>
        </div>
        {messages.map(message => (
          <div 
            key={message.id || getUniqueId()}
            className="group/message relative space-y-1 hover:bg-gray-50 rounded px-2 py-1 -mx-2"
            role="article"
            aria-label={`Message from ${userId} at ${new Date(message.created_at || message.timestamp).toLocaleTimeString()}`}
          >
            <p className={`text-gray-700 ${sendingMessages?.has(message.id) ? 'opacity-70' : ''}`}>
              {message.content}
            </p>
            <div className="flex items-center gap-2">
              <time 
                dateTime={message.created_at || message.timestamp}
                className="text-xs text-gray-500"
              >
                {new Date(message.created_at || message.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit'
                })}
              </time>
              {sendingMessages?.has(message.id) && (
                <span 
                  className="text-xs text-gray-500 animate-pulse"
                  role="status"
                  aria-live="polite"
                >
                  Sending...
                </span>
              )}
            </div>
            <div className="mt-1">
              <MessageReactions
                reactions={message.reactions || {}}
                userReactions={userReactions?.get(message.id) || new Set()}
                onReact={(reaction) => onReact(message.id, reaction)}
                disabled={sendingMessages?.has(message.id)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  return (
    prevProps.messages === nextProps.messages &&
    prevProps.sendingMessages === nextProps.sendingMessages &&
    prevProps.userReactions === nextProps.userReactions
  )
})

const DateDivider = memo(function DateDivider({ date }) {
  return (
    <div 
      className="flex items-center my-4"
      role="separator"
      aria-label={new Date(date).toLocaleDateString([], {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      })}
    >
      <div className="flex-1 border-t border-gray-200" />
      <time 
        dateTime={date}
        className="mx-4 text-xs text-gray-500"
      >
        {new Date(date).toLocaleDateString([], {
          weekday: 'long',
          month: 'long',
          day: 'numeric'
        })}
      </time>
      <div className="flex-1 border-t border-gray-200" />
    </div>
  )
})

const UnreadBanner = memo(function UnreadBanner({ onClick, count }) {
  return (
    <div 
      className="sticky top-2 flex justify-center"
      style={{ zIndex: 1 }}
      role="status"
      aria-live="polite"
    >
      <button
        onClick={onClick}
        className="
          bg-blue-500 text-white px-4 py-1 rounded-full text-sm
          shadow-lg hover:bg-blue-600 transition-colors
          flex items-center gap-2
        "
        aria-label="Scroll to new messages"
      >
        <span>New messages{count ? ` (${count})` : ''}</span>
        <span className="text-xs" aria-hidden="true">↓</span>
      </button>
    </div>
  )
})

function Message({ message }) {
  const bgColor = useColorModeValue('gray.50', 'gray.700')
  const textColor = useColorModeValue('gray.800', 'gray.100')
  const timeColor = useColorModeValue('gray.500', 'gray.400')

  return (
    <Box 
      p={3} 
      bg={bgColor} 
      borderRadius="lg"
      maxW="80%"
      alignSelf={message.sender === 'user' ? 'flex-end' : 'flex-start'}
    >
      <Text color={textColor}>{message.content}</Text>
      <Text fontSize="xs" color={timeColor} mt={1}>
        {new Date(message.timestamp).toLocaleTimeString()}
      </Text>
    </Box>
  )
}

export default function ChatMessageList({ 
  messages, 
  loading, 
  sendingMessages = new Set(),
  onReact = () => {},
  userReactions = new Map(),
  spaceType = 'garden'
}) {
  const [error, setError] = useState(null)
  const [showUnread, setShowUnread] = useState(false)
  const [isNearBottom, setIsNearBottom] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const scrollRef = useRef(null)
  const lastMessageRef = useRef(null)
  const lastMessagesRef = useRef(messages)

  // Handle reactions
  const handleReaction = useCallback((messageId, reaction) => {
    onReact(messageId, reaction)
  }, [onReact])

  // Group messages by date
  const messagesByDate = useMemo(() => {
    return messages.reduce((acc, message) => {
      const date = new Date(message.created_at || message.timestamp).toDateString()
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(message)
      return acc
    }, {})
  }, [messages])

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current) return
      
      const { scrollHeight, scrollTop, clientHeight } = scrollRef.current
      const bottom = scrollHeight - scrollTop - clientHeight
      const wasNearBottom = isNearBottom
      const newIsNearBottom = bottom < 100
      
      setIsNearBottom(newIsNearBottom)
      
      if (newIsNearBottom) {
        setShowUnread(false)
        setUnreadCount(0)
      }
    }

    const container = scrollRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true })
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [isNearBottom])

  useEffect(() => {
    if (messages !== lastMessagesRef.current) {
      const newMessages = messages.length - lastMessagesRef.current.length
      if (newMessages > 0 && !isNearBottom) {
        setUnreadCount(prev => prev + newMessages)
      }
      lastMessagesRef.current = messages
    }
  }, [messages, isNearBottom])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (loading) {
    return (
      <VStack spacing={4} p={4} align="stretch">
        {[...Array(3)].map((_, i) => (
          <Skeleton 
            key={i} 
            height="100px" 
            borderRadius="lg"
            startColor="gray.100"
            endColor="gray.200"
            speed={2}
            isLoaded={false}
          />
        ))}
      </VStack>
    )
  }

  if (!messages.length) {
    return (
      <Box 
        h="full" 
        display="flex" 
        alignItems="center" 
        justifyContent="center"
      >
        <Text color="gray.500">No messages yet</Text>
      </Box>
    )
  }

  if (error) {
    return (
      <div 
        className="flex-1 flex items-center justify-center p-4 text-red-600"
        role="alert"
      >
        <div className="text-center">
          <p className="font-medium">Error loading messages</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const scrollToBottom = () => {
    lastMessageRef.current?.scrollIntoView({ behavior: 'smooth' })
    setShowUnread(false)
    setUnreadCount(0)
  }

  return (
    <div 
      ref={scrollRef}
      className="flex-1 p-4 space-y-2 overflow-y-auto"
      role="log"
      aria-label="Message history"
      aria-live="polite"
    >
      {showUnread && <UnreadBanner onClick={scrollToBottom} count={unreadCount} />}
      {Object.entries(messagesByDate).map(([date, dateMessages], dateIndex, datesArray) => {
        const messageGroups = dateMessages.reduce((groups, message) => {
          const lastGroup = groups[groups.length - 1]
          const timeDiff = lastGroup 
            ? new Date(message.created_at || message.timestamp) - new Date(lastGroup[lastGroup.length - 1].created_at || lastGroup[lastGroup.length - 1].timestamp)
            : 0

          if (
            lastGroup && 
            message.sender === lastGroup[0].sender &&
            timeDiff < 5 * 60 * 1000 // 5 minutes
          ) {
            lastGroup.push(message)
          } else {
            groups.push([message])
          }
          return groups
        }, [])

        const isLastDate = dateIndex === datesArray.length - 1

        return (
          <div key={date}>
            <DateDivider date={date} />
            <div className="space-y-4">
              {messageGroups.map((group, groupIndex) => {
                const groupKey = `${date}-${groupIndex}-${group[0].id}`
                return (
                  <div 
                    key={groupKey}
                    ref={isLastDate && groupIndex === messageGroups.length - 1 ? lastMessageRef : null}
                  >
                    <MemoizedMessageGroup 
                      messages={group}
                      sendingMessages={sendingMessages}
                      onReact={handleReaction}
                      userReactions={userReactions}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
} 