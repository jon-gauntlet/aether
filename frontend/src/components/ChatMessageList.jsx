import React, { useRef, useEffect } from 'react';
import { Box, VStack, Text, Skeleton } from '@chakra-ui/react';
import { ErrorBoundary } from './ErrorBoundary';

function ChatMessage({ message }) {
  const isUser = message.sender?.id === 'demo-user';
  
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
      {message.timestamp && (
        <Text fontSize="xs" opacity={0.8} mt={1}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </Text>
      )}
    </Box>
  );
}

function ChatMessageListComponent({ messages = [], isLoading }) {
  const bottomRef = useRef(null);
  
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLoading) {
    return (
      <VStack spacing={4} align="stretch" p={4}>
        <Skeleton height="40px" width="60%" startColor="gray.700" endColor="gray.600" />
        <Skeleton height="60px" width="75%" alignSelf="flex-end" startColor="blue.700" endColor="blue.600" />
        <Skeleton height="40px" width="65%" startColor="gray.700" endColor="gray.600" />
      </VStack>
    );
  }

  if (!messages.length) {
    return (
      <Box p={4} textAlign="center" color="gray.500">
        No messages yet. Try sending one!
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
      p={4}
    >
      {messages.map((message, index) => (
        <ChatMessage
          key={message.id || index}
          message={message}
        />
      ))}
      <div ref={bottomRef} />
    </VStack>
  );
}

export const ChatMessageList = (props) => (
  <ErrorBoundary>
    <ChatMessageListComponent {...props} />
  </ErrorBoundary>
); 