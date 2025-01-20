import React, { useRef, useEffect } from 'react';
import { Box, VStack, Text, Skeleton, Fade } from '@chakra-ui/react';
import { ErrorBoundary } from './ErrorBoundary';
import { Message } from './Message';

function ChatMessage({ message, isUser, onReaction }) {
  return (
    <Box
      data-testid="message-container"
      alignSelf={isUser ? 'flex-end' : 'flex-start'}
      bg={isUser ? 'blue.500' : 'gray.700'}
      color="white"
      p={3}
      borderRadius="lg"
      maxW="70%"
      opacity={0}
      animation="fadeIn 0.3s ease-in forwards"
      sx={{
        '@keyframes fadeIn': {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        }
      }}
    >
      <Text>{message.content}</Text>
      {message.created_at && (
        <Text fontSize="xs" opacity={0.8} mt={1}>
          {new Date(message.created_at).toLocaleTimeString()}
        </Text>
      )}
    </Box>
  );
}

function ChatMessageListComponent({ messages = [], isLoading, error, typingUsers, onReaction }) {
  const bottomRef = useRef(null);
  
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (error) {
    return (
      <Box role="alert" p={4} color="red.500">
        {error}
      </Box>
    );
  }

  if (isLoading) {
    return (
      <VStack spacing={4} align="stretch" p={4}>
        <Skeleton data-testid="skeleton" height="40px" width="60%" startColor="gray.700" endColor="gray.600" />
        <Skeleton data-testid="skeleton" height="60px" width="75%" alignSelf="flex-end" startColor="blue.700" endColor="blue.600" />
        <Skeleton data-testid="skeleton" height="80px" width="65%" startColor="gray.700" endColor="gray.600" />
        <Skeleton data-testid="skeleton" height="40px" width="70%" alignSelf="flex-end" startColor="blue.700" endColor="blue.600" />
      </VStack>
    );
  }

  if (!messages.length) {
    return (
      <Box p={4} textAlign="center" color="gray.500">
        No messages yet
      </Box>
    );
  }

  return (
    <VStack
      data-testid="chat-message-list"
      spacing={4}
      align="stretch"
      w="100%"
      maxH="calc(100vh - 200px)"
      overflowY="auto"
    >
      {isLoading ? (
        <>
          <Skeleton data-testid="skeleton" height="60px" />
          <Skeleton data-testid="skeleton" height="60px" />
          <Skeleton data-testid="skeleton" height="60px" />
        </>
      ) : messages?.length === 0 ? (
        <Text data-testid="empty-message">No messages yet</Text>
      ) : (
        messages?.map((message, index) => (
          <ChatMessage
            key={message.id || index}
            message={message}
            isUser={message.user_id === 'anonymous'}
            onReaction={onReaction}
          />
        ))
      )}
      
      {typingUsers.size > 0 && (
        <Box p={2}>
          <Text fontSize="sm" color="gray.500">
            {Array.from(typingUsers).join(', ')} 
            {typingUsers.size === 1 ? ' is ' : ' are '} 
            typing...
          </Text>
        </Box>
      )}
      
      <div ref={bottomRef} />
    </VStack>
  );
}

export const ChatMessageList = (props) => (
  <ErrorBoundary>
    <ChatMessageListComponent {...props} />
  </ErrorBoundary>
); 