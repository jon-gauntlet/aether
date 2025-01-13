import React, { useState, KeyboardEvent } from 'react';
import styled from 'styled-components';
import { useMessages } from '../../hooks/useMessages';

interface MessageInputProps {
  chatId: string;
  onSend?: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ chatId, onSend }) => {
  const [message, setMessage] = useState('');
  const { sendMessage } = useMessages(chatId);

  const handleKeyPress = async (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (message.trim()) {
        await sendMessage(message);
        setMessage('');
        onSend?.();
      }
    }
  };

  return (
    <Container>
      <StyledTextarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Type a message..."
        rows={1}
      />
      <SendButton 
        onClick={async () => {
          if (message.trim()) {
            await sendMessage(message);
            setMessage('');
            onSend?.();
          }
        }}
      >
        Send
      </SendButton>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  gap: 8px;
  padding: 16px;
  background: ${({ theme }) => theme.colors.surface};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const StyledTextarea = styled.textarea`
  flex: 1;
  min-height: 40px;
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  resize: none;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const SendButton = styled.button`
  padding: 8px 16px;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  cursor: pointer;
  font-weight: 500;
  
  &:hover {
    opacity: 0.9;
  }
`;

export default MessageInput; 