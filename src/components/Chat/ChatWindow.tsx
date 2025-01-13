import React from 'react';
import styled from 'styled-components';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { useMessages } from '../../hooks/useMessages';

const ChatWindow: React.FC = () => {
  const { messages, loading } = useMessages('general');

  if (loading) {
    return <Container>Loading...</Container>;
  }

  return (
    <Container>
      <MessageList messages={messages} />
      <MessageInput chatId="general" />
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-height: 800px;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.md};
  overflow: hidden;
`;

export default ChatWindow; 