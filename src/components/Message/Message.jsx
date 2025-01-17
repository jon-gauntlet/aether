/**
 * Message Component
 * 
 * Core message display component that integrates multiple features:
 * 1. Content rendering via MessageContent
 * 2. Reactions via ReactionDisplay (from reactions/)
 * 3. Thread support
 * 4. Loading states
 * 
 * Related components:
 * - MessageContent: Handles content & attachment rendering
 * - ReactionDisplay: Handles reactions with space awareness
 * - MessageCluster: For grouped message display
 * 
 * Providers needed:
 * - MessageProvider: For message state
 * - ReactionProvider: For reaction handling
 * - SpaceProvider: For space-aware features
 */

import React from 'react';
import { Box, Text, Skeleton, HStack, IconButton } from '@chakra-ui/react';
import { format, isValid } from 'date-fns';
import { ChatIcon } from '@chakra-ui/icons';
import { MessageContent } from './MessageContent';
import { ReactionDisplay } from '../reactions/ReactionDisplay';

export function Message({ content, timestamp, attachments, isLoading, messageId, threadId, onThreadClick }) {
  const formatTimestamp = (ts) => {
    if (!ts) return '';
    const date = new Date(ts);
    return isValid(date) ? format(date, 'PPpp') : '';
  };

  if (isLoading) {
    return (
      <Box p={4} mb={2}>
        <Skeleton height="20px" width="60%" mb={2} data-testid="skeleton" />
        <Skeleton height="14px" width="30%" data-testid="skeleton" />
      </Box>
    );
  }

  return (
    <Box p={4} mb={2} borderRadius="md" borderWidth="1px" data-testid="message-container">
      <MessageContent 
        content={content} 
        attachments={attachments}
      />
      
      <HStack mt={2} spacing={2} justify="space-between">
        <ReactionDisplay messageId={messageId} />

        <HStack spacing={2}>
          {timestamp && (
            <Text fontSize="sm" color="gray.500" data-testid="message-timestamp">
              {formatTimestamp(timestamp)}
            </Text>
          )}
          {onThreadClick && (
            <IconButton
              size="sm"
              icon={<ChatIcon />}
              aria-label="Open thread"
              variant="ghost"
              onClick={() => onThreadClick(messageId)}
              data-testid="thread-button"
            />
          )}
        </HStack>
      </HStack>
      
      {threadId && (
        <Box mt={2} pl={4} borderLeft="2px" borderColor="gray.200" data-testid="thread-indicator">
          <Text 
            fontSize="sm" 
            color="gray.500" 
            cursor="pointer" 
            onClick={() => onThreadClick?.(threadId)}
            data-testid="thread-link"
          >
            View thread
          </Text>
        </Box>
      )}
    </Box>
  );
} 