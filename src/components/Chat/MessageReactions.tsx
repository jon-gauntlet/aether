import React from 'react';
import styled from 'styled-components';

interface Props {
  reactions: Record<string, string[]>;
  onReactionSelect: (emoji: string) => void;
  isOwn: boolean;
}

const Container = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

const Reaction = styled.div<{ isSelected: boolean; isOwn: boolean }>`
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 0.9em;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  background: ${({ theme, isSelected, isOwn }) => 
    isSelected 
      ? isOwn 
        ? theme.colors.primaryLight 
        : theme.colors.surfaceHover
      : 'transparent'
  };
  border: 1px solid ${({ theme, isSelected, isOwn }) => 
    isSelected
      ? isOwn 
        ? theme.colors.primary
        : theme.colors.border
      : theme.colors.border
  };
  
  &:hover {
    background: ${({ theme, isOwn }) => 
      isOwn ? theme.colors.primaryLight : theme.colors.surfaceHover};
  }
`;

const Count = styled.span`
  color: ${({ theme }) => theme.colors.textLight};
`;

const QUICK_REACTIONS = ['👍', '❤️', '😄', '🎉', '🤔', '👀'];

export const MessageReactions: React.FC<Props> = ({
  reactions,
  onReactionSelect,
  isOwn
}) => {
  const currentUserId = 'currentUser'; // TODO: Get from auth context

  return (
    <Container>
      {Object.entries(reactions).map(([emoji, users]) => (
        <Reaction
          key={emoji}
          isSelected={users.includes(currentUserId)}
          isOwn={isOwn}
          onClick={() => onReactionSelect(emoji)}
        >
          {emoji} <Count>{users.length}</Count>
        </Reaction>
      ))}
      {QUICK_REACTIONS.map(emoji => 
        !reactions[emoji] && (
          <Reaction
            key={emoji}
            isSelected={false}
            isOwn={isOwn}
            onClick={() => onReactionSelect(emoji)}
          >
            {emoji}
          </Reaction>
        )
      )}
    </Container>
  );
}; 