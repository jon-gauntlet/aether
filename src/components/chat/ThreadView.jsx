import React from 'react';
import { Box, VStack, IconButton, Text } from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';
import ChatInput from './ChatInput';
import ChatMessageList from './ChatMessageList';

export default function ThreadView({ parentMessage, onClose, spaceType }) {
  if (!parentMessage) return null;

  return (
    <VStack h="full" spacing={4}>
      <Box w="full" display="flex" justifyContent="space-between" alignItems="center">
        <Text fontWeight="bold">Thread</Text>
        <IconButton
          icon={<CloseIcon />}
          aria-label="Close thread"
          size="sm"
          variant="ghost"
          onClick={onClose}
        />
      </Box>

      <Box flex="1" w="full" overflow="hidden">
        <Box p={4} mb={4} borderRadius="md" bg="gray.50" _dark={{ bg: 'gray.700' }}>
          <Text fontWeight="medium">{parentMessage.content}</Text>
        </Box>

        <ChatMessageList
          messages={parentMessage.replies || []}
          spaceType={spaceType}
        />
      </Box>

      <ChatInput
        placeholder="Reply in thread..."
        onSendMessage={(content) => {
          // Handle thread reply
          console.log('Thread reply:', content);
        }}
      />
    </VStack>
  );
} 