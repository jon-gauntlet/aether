import React from 'react'
import { Box, Text, VStack, HStack, Avatar } from '@chakra-ui/react'

export function Message({ content, timestamp, role, avatar }) {
  const isUser = role === 'user'
  
  return (
    <HStack
      spacing={2}
      align="flex-start"
      justify={isUser ? 'flex-end' : 'flex-start'}
      w="100%"
    >
      {!isUser && (
        <Avatar
          size="sm"
          name="AI Assistant"
          src={avatar}
          bg="blue.500"
        />
      )}
      <VStack
        align={isUser ? 'flex-end' : 'flex-start'}
        maxW="70%"
        spacing={1}
      >
        <Box
          bg={isUser ? 'blue.500' : 'gray.700'}
          color="white"
          px={4}
          py={2}
          borderRadius="lg"
          whiteSpace="pre-wrap"
        >
          <Text>{content}</Text>
        </Box>
        {timestamp && (
          <Text fontSize="xs" color="gray.500">
            {new Date(timestamp).toLocaleTimeString()}
          </Text>
        )}
      </VStack>
      {isUser && (
        <Avatar
          size="sm"
          name="User"
          bg="green.500"
        />
      )}
    </HStack>
  )
} 