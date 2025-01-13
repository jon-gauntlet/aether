import React, { useCallback } from 'react';
import styled from 'styled-components';
import { Message, MessageType } from '../../core/types/chat';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { withProtection } from '../../core/sled/protection';
import { useFlowState } from '../../hooks/useFlowState';

interface ThreadViewProps {
  messages: Message[];
  onSendMessage: (content: string, type?: MessageType) => void;
  onMessageSelect?: (messageId: string, messageType: MessageType) => void;
  threadId?: string;
  isTyping?: boolean;
}

const ThreadContainer = styled.div<{ isProtected: boolean }>`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  box-shadow: ${({ theme, isProtected }) => 
    isProtected ? theme.shadows.lg : 'none'};
  transition: box-shadow 0.3s ease;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-right: ${({ theme }) => theme.spacing.sm};

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.surface};
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.primary};
    border-radius: 2px;
  }
`;

const InputContainer = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

export const ThreadView: React.FC<ThreadViewProps> = ({
  messages,
  onSendMessage,
  onMessageSelect,
  threadId
}) => {
  const { isProtected } = useFlowState();

  const handleSend = useCallback((content: string) => {
    withProtection(async () => {
      onSendMessage(content);
    }, { type: 'message-send' });
  }, [onSendMessage]);

  return (
    <ThreadContainer isProtected={isProtected}>
      <MessagesContainer>
        <MessageList 
          messages={messages}
          onMessageSelect={onMessageSelect}
        />
      </MessagesContainer>
      <InputContainer>
        <MessageInput 
          onSendMessage={handleSend}
          placeholder={`Message ${threadId ? 'thread' : 'channel'}...`}
        />
      </InputContainer>
    </ThreadContainer>
  );
}; 