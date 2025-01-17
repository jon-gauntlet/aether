import { HStack, Button, Text, Tooltip } from '@chakra-ui/react';
import { withErrorBoundary } from './ErrorBoundary';

const ReactionDisplayComponent = ({ reactions = [], userReactions = [], onReact, isLoading, error }) => {
  const reactionCounts = reactions.reduce((acc, reaction) => {
    acc[reaction] = (acc[reaction] || 0) + 1;
    return acc;
  }, {});

  if (error) {
    return (
      <Text color="red.500" role="alert">
        {error}
      </Text>
    );
  }

  return (
    <HStack spacing={2} data-testid="reaction-display">
      {Object.entries(reactionCounts).map(([reaction, count]) => {
        const isActive = userReactions?.includes(reaction);
        const tooltipText = `${count} ${count === 1 ? 'person' : 'people'} reacted`;
        return (
          <Tooltip 
            key={reaction}
            label={tooltipText}
            hasArrow
            placement="top"
            openDelay={300}
          >
            <Button
              data-testid={`reaction-${reaction}`}
              size="sm"
              variant="ghost"
              onClick={() => onReact?.(reaction)}
              isDisabled={isLoading}
              aria-disabled={isLoading}
              backgroundColor={isActive ? 'blue.500' : undefined}
              color={isActive ? 'white' : undefined}
              _hover={{
                backgroundColor: isActive ? 'blue.600' : 'gray.100'
              }}
            >
              <Text>{reaction}</Text>
              <Text ml={1}>{count}</Text>
            </Button>
          </Tooltip>
        );
      })}
    </HStack>
  );
};

export const ReactionDisplay = withErrorBoundary(ReactionDisplayComponent); 