import React, { useState, useEffect, useRef, memo } from 'react';
import { VStack, Box, Text, Skeleton } from '@chakra-ui/react';
import MessageReactions from './MessageReactions';
import { ConsciousnessField } from '../visualization/ConsciousnessField';
import { MessageCluster } from '../visualization/MessageCluster';

// Utility for message grouping
const groupMessagesByTime = (messages, threshold = 5 * 60 * 1000) => {
  const groups = [];
  let currentGroup = [];

  messages.forEach((message, index) => {
    if (index === 0) {
      currentGroup.push(message);
      return;
    }

    const prevMessage = messages[index - 1];
    const timeDiff = new Date(message.timestamp) - new Date(prevMessage.timestamp);

    if (timeDiff < threshold && prevMessage.sender === message.sender) {
      currentGroup.push(message);
    } else {
      if (currentGroup.length > 0) {
        groups.push([...currentGroup]);
      }
      currentGroup = [message];
    }
  });

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
};

const MessageGroup = memo(function MessageGroup({ 
  messages, 
  spaceType,
  onThreadClick 
}) {
  if (!messages?.length) return null;
  
  const firstMessage = messages[0];
  const userId = firstMessage?.sender || 'anonymous';
  
  return (
    <Box 
      className="message-group"
      role="group"
      aria-label={`Messages from ${userId}`}
      position="relative"
    >
      {spaceType === 'library' && (
        <MessageCluster 
          messages={messages}
          spaceType={spaceType}
        />
      )}
      
      <Box className="messages" pl={10}>
        {messages.map(message => (
          <Box 
            key={message.id}
            className="message"
            onClick={() => onThreadClick?.(message)}
            cursor="pointer"
            _hover={{ bg: 'gray.50' }}
            borderRadius="md"
            p={2}
            mb={2}
          >
            <Text>{message.content}</Text>
            
            {message.ragContext && (
              <Box 
                mt={2} 
                p={2} 
                bg="blue.50" 
                borderRadius="md"
                fontSize="sm"
              >
                <Text fontWeight="bold">Related Context:</Text>
                <Text>{message.ragContext.text}</Text>
              </Box>
            )}
            
            <MessageReactions
              reactions={message.reactions || {}}
              messageId={message.id}
            />
            
            {message.replies?.length > 0 && (
              <Box 
                mt={2}
                p={2}
                bg="gray.50"
                borderRadius="md"
                fontSize="sm"
                cursor="pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onThreadClick?.(message);
                }}
              >
                {message.replies.length} replies
              </Box>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
});

export default function MessageList({ 
  messages = [], 
  loading, 
  spaceType,
  onThreadClick 
}) {
  const [groups, setGroups] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    setGroups(groupMessagesByTime(messages));
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [groups]);

  if (loading) {
    return (
      <VStack spacing={4} align="stretch">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} height="100px" />
        ))}
      </VStack>
    );
  }

  return (
    <Box 
      ref={scrollRef}
      height="100%"
      overflowY="auto"
      position="relative"
      className="message-list"
    >
      {spaceType === 'library' && (
        <ConsciousnessField messages={messages} />
      )}
      
      <VStack spacing={6} align="stretch" p={4}>
        {groups.map((group, index) => (
          <MessageGroup
            key={group[0].id}
            messages={group}
            spaceType={spaceType}
            onThreadClick={onThreadClick}
          />
        ))}
      </VStack>
    </Box>
  );
} 