import React from 'react'
import { Box, Text, Avatar, HStack, VStack } from '@chakra-ui/react'
import { ErrorBoundary } from './ErrorBoundary'
import { ReactionDisplay } from '../../components/ReactionDisplay'

const MessageComponent = ({ message, isUser }) => {
  if (message.error) {
    return (
      <Text color="red.500" data-testid="message-error">
        Failed to process message
      </Text>
    );
  }

  if (message.loading) {
    return <Box data-testid="message-loading">Loading...</Box>;
  }

  return (
    <Box
      data-testid={isUser ? 'message-user' : 'message-assistant'}
      alignSelf={isUser ? 'flex-end' : 'flex-start'}
      maxWidth="70%"
      bg={isUser ? 'blue.500' : 'gray.100'}
      color={isUser ? 'white' : 'black'}
      p={3}
      borderRadius="lg"
    >
      <HStack spacing={3} align="start">
        {!isUser && <Avatar size="sm" name={message.sender} />}
        <VStack align={isUser ? 'flex-end' : 'flex-start'} spacing={1}>
          {!isUser && <Text fontSize="sm" fontWeight="bold">{message.sender}</Text>}
          <Text>{message.content}</Text>
          {message.timestamp && (
            <Text fontSize="xs" color="gray.500" data-testid="message-timestamp">
              {new Date(message.timestamp).toLocaleString()}
            </Text>
          )}
          {message.code && (
            <Box 
              data-testid="code-block"
              bg="gray.800" 
              color="white" 
              p={2} 
              borderRadius="md"
              width="100%"
            >
              <Text fontFamily="monospace">{message.code}</Text>
            </Box>
          )}
          <ReactionDisplay messageId={message.id} reactions={message.reactions} />
        </VStack>
      </HStack>
    </Box>
  )
}

export const Message = (props) => (
  <ErrorBoundary>
    <MessageComponent {...props} />
  </ErrorBoundary>
) 