import React from 'react'
import { VStack, Box, Text, Button, HStack, IconButton } from '@chakra-ui/react'
import { SmileIcon, MessageSquareIcon } from 'lucide-react'

const MOCK_USER = {
  id: 'demo-user',
  name: 'Demo User',
  email: 'demo@example.com'
};

export default function ChatMessageList({ messages, onThreadClick, userReactions, onReaction }) {
  return (
    <VStack 
      spacing={4} 
      align="stretch" 
      p={4} 
      overflowY="auto" 
      flex={1}
      css={{
        '&::-webkit-scrollbar': {
          width: '4px',
        },
        '&::-webkit-scrollbar-track': {
          width: '6px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'gray.500',
          borderRadius: '24px',
        },
      }}
    >
      {messages.map(message => (
        <Box 
          key={message.id}
          p={3}
          bg={message.sender === 'AI Assistant' ? 'blue.50' : 'gray.50'}
          borderRadius="md"
          position="relative"
        >
          <Text fontSize="sm" color="gray.500" mb={1}>
            {message.sender}
          </Text>
          <Text>{message.content}</Text>
          
          {message.replies?.length > 0 && (
            <Box mt={2} pl={4} borderLeft="2px" borderColor="gray.200">
              <Text fontSize="sm" color="gray.500">
                {message.replies.length} replies
              </Text>
            </Box>
          )}

          <HStack mt={2} spacing={2}>
            <IconButton
              icon={<SmileIcon size={16} />}
              size="xs"
              variant="ghost"
              aria-label="Add reaction"
              onClick={() => onReaction(message.id, '👍')}
            />
            <IconButton
              icon={<MessageSquareIcon size={16} />}
              size="xs"
              variant="ghost"
              aria-label="Reply in thread"
              onClick={() => onThreadClick(message)}
            />
            {Object.entries(message.reactions || {}).map(([reaction, count]) => (
              <Button
                key={reaction}
                size="xs"
                variant={userReactions.get(message.id)?.has(reaction) ? 'solid' : 'outline'}
                onClick={() => onReaction(message.id, reaction)}
              >
                {reaction} {count}
              </Button>
            ))}
          </HStack>
        </Box>
      ))}
    </VStack>
  )
} 