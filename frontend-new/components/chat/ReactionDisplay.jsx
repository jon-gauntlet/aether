import React, { useState } from 'react';
import { HStack, Button, Text, Tooltip } from '@chakra-ui/react';

export function ReactionDisplay({ messageId, reactions, userReactions = [], onReact, isLoading = false }) {
  const [hoveredReaction, setHoveredReaction] = useState(null);

  const handleReaction = (reaction) => {
    onReact(messageId, reaction);
  };

  const getTooltipText = (reaction, count) => {
    return `${count} ${count === 1 ? 'person' : 'people'} reacted`;
  };

  return (
    <HStack spacing={2} data-testid="reaction-display">
      {Object.entries(reactions).map(([reaction, count]) => {
        const isUserReacted = userReactions.includes(reaction);
        const tooltipText = getTooltipText(reaction, count);

        return (
          <Tooltip 
            key={reaction} 
            label={tooltipText}
            openDelay={300}
            placement="top"
            isOpen={hoveredReaction === reaction}
          >
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleReaction(reaction)}
              style={{ backgroundColor: isUserReacted ? 'var(--chakra-colors-gray-200)' : undefined }}
              _hover={{ backgroundColor: isUserReacted ? 'var(--chakra-colors-gray-300)' : 'var(--chakra-colors-gray-100)' }}
              isDisabled={isLoading}
              data-testid={`reaction-${reaction}`}
              onMouseEnter={() => setHoveredReaction(reaction)}
              onMouseLeave={() => setHoveredReaction(null)}
            >
              <Text>{reaction}</Text>
              {count > 0 && (
                <Text ml={1} data-testid={`reaction-count-${reaction}`}>{count}</Text>
              )}
            </Button>
          </Tooltip>
        );
      })}
    </HStack>
  );
} 