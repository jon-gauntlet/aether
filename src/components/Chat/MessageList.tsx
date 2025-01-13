import React from 'react';
import styled from 'styled-components';
import { Message } from '../../core/types/chat';
import { formatTimestamp } from '../../core/utils/time';

interface MessageListProps {
  messages: Message[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  return (
    <Container>
      {messages.map((message) => (
        <MessageItem key={message.id}>
          <MessageContent>
            <MessageText>{message.content}</MessageText>
            <MessageTime>{formatTimestamp(message.timestamp)}</MessageTime>
          </MessageContent>
        </MessageItem>
      ))}
    </Container>
  );
};

const Container = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
`;

const MessageItem = styled.div`
  margin-bottom: 16px;
`;

const MessageContent = styled.div`
  background: ${({ theme }) => theme.colors.background};
  padding: 12px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

const MessageText = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
`;

const MessageTime = styled.span`
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.secondary};
`;

export default MessageList; 