import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useMessages } from '../../core/messaging/MessageProvider';

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 500px;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: ${({ theme }) => theme.space.lg};
  box-shadow: 0 2px 4px ${({ theme }) => theme.colors.shadow};
  width: 100%;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  margin-bottom: ${({ theme }) => theme.space.md};
  padding-right: ${({ theme }) => theme.space.sm};

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.background};
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.primary};
    border-radius: 3px;
  }
`;

const MessageBubble = styled.div`
  background: ${({ isOwn, theme }) => isOwn ? theme.colors.primary : theme.colors.surface};
  color: ${({ isOwn, theme }) => isOwn ? '#fff' : theme.colors.text};
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  margin: ${({ theme }) => theme.space.xs} 0;
  max-width: 80%;
  align-self: ${({ isOwn }) => isOwn ? 'flex-end' : 'flex-start'};
  box-shadow: 0 1px 2px ${({ theme }) => theme.colors.shadow};
`;

const InputContainer = styled.form`
  display: flex;
  gap: ${({ theme }) => theme.space.sm};
`;

const Input = styled.input`
  flex: 1;
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border: 1px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.md};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px ${({ theme }) => `${theme.colors.primary}33`};
  }
`;

const SendButton = styled.button`
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.lg};
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSizes.md};
  transition: background ${({ theme }) => theme.transitions.normal};

  &:hover {
    background: ${({ theme }) => `${theme.colors.primary}dd`};
  }

  &:active {
    background: ${({ theme }) => `${theme.colors.primary}bb`};
  }
`;

const MessageInfo = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textAlt};
  margin-bottom: ${({ theme }) => theme.space.xs};
`;

const MessageContent = styled.div`
  word-wrap: break-word;
`;

export function Chat() {
  const [inputValue, setInputValue] = useState('');
  const { messages, sendMessage } = useMessages();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      sendMessage(inputValue);
      setInputValue('');
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <ChatContainer>
      <MessagesContainer>
        {messages.map((message) => (
          <MessageBubble key={message.id} isOwn={message.isOwn}>
            <MessageInfo>
              {message.userName} • {formatTime(message.timestamp)}
            </MessageInfo>
            <MessageContent>{message.text}</MessageContent>
          </MessageBubble>
        ))}
        <div ref={messagesEndRef} />
      </MessagesContainer>
      <InputContainer onSubmit={handleSubmit}>
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type a message..."
        />
        <SendButton type="submit">Send</SendButton>
      </InputContainer>
    </ChatContainer>
  );
} 