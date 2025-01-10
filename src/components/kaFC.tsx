import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Message, ChatSystem, User } from '../../core/chat/ChatSystem';

interface MessageListProps {
  chatSystem: ChatSystem;
  channelId: string;
  threadId?: string;
  currentUser: User;
}

const Container = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #363636;
  display: flex;
  flex-direction: column;
`;

const MessageGroup = styled.div`
  margin-bottom: 16px;
`;

const MessageHeader = styled.div`
  display: flex;
  align-items: baseline;
  margin-bottom: 4px;
`;

const UserName = styled.span`
  font-weight: 500;
  color: #ffffff;
  margin-right: 8px;
`;

const Timestamp = styled.span`
  font-size: 12px;
  color: #a0a0a0;
`;

const MessageContent = styled.div`
  color: #e0e0e0;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-word;
`;

const FileAttachment = styled.div`
  margin-top: 8px;
  padding: 8px;
  background: #2c2c2c;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FileIcon = styled.div`
  width: 32px;
  height: 32px;
  background: #4c4c4c;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
`;

const FileInfo = styled.div`
  flex: 1;
  min-width: 0;

  .file-name {
    color: #ffffff;
    font-weight: 500;
    margin-bottom: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .file-type {
    font-size: 12px;
    color: #a0a0a0;
  }
`;

const ReactionList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
`;

const ReactionButton = styled.button<{ active: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  background: ${props => props.active ? '#4c4c4c' : '#2c2c2c'};
  border: 1px solid #4c4c4c;
  border-radius: 12px;
  color: #e0e0e0;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: #4c4c4c;
  }
`;

const ThreadButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: none;
  border: none;
  color: #a0a0a0;
  font-size: 12px;
  cursor: pointer;
  margin-top: 4px;

  &:hover {
    color: #ffffff;
  }
`;

const MessageActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 4px;
`;

export const MessageList: React.FC<MessageListProps> = ({
  chatSystem,
  channelId,
  threadId,
  currentUser
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const subscription = threadId
      ? chatSystem.observeThread(threadId)
      : chatSystem.observeChannel(channelId);

    subscription.subscribe(messages => {
      setMessages(messages);
      // Auto-scroll to bottom on new messages
      if (containerRef.current) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      }
    });

    return () => subscription.unsubscribe();
  }, [chatSystem, channelId, threadId]);

  const handleReaction = (messageId: string, emoji: string) => {
    chatSystem.toggleReaction(messageId, currentUser.id, emoji);
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isReactionActive = (reactions: Message['reactions'], emoji: string): boolean => {
    return reactions?.[emoji]?.includes(currentUser.id) || false;
  };

  const getReactionCount = (reactions: Message['reactions'], emoji: string): number => {
    return reactions?.[emoji]?.length || 0;
  };

  return (
    <Container ref={containerRef}>
      {messages.map(message => (
        <MessageGroup key={message.id}>
          <MessageHeader>
            <UserName>{message.userId}</UserName>
            <Timestamp>{formatTimestamp(message.timestamp)}</Timestamp>
          </MessageHeader>
          <MessageContent>{message.content}</MessageContent>
          
          {/* File Attachments */}
          {message.files?.map(file => (
            <FileAttachment key={file.id}>
              <FileIcon>📎</FileIcon>
              <FileInfo>
                <div className="file-name">{file.name}</div>
                <div className="file-type">{file.type}</div>
              </FileInfo>
            </FileAttachment>
          ))}

          <MessageActions>
            {/* Reactions */}
            <ReactionList>
              {['👍', '❤️', '😄', '🎉', '🤔', '👀'].map(emoji => (
                <ReactionButton
                  key={emoji}
                  active={isReactionActive(message.reactions, emoji)}
                  onClick={() => handleReaction(message.id, emoji)}
                >
                  {emoji}
                  {getReactionCount(message.reactions, emoji) > 0 && (
                    <span>{getReactionCount(message.reactions, emoji)}</span>
                  )}
                </ReactionButton>
              ))}
            </ReactionList>

            {/* Thread Button */}
            {!threadId && (
              <ThreadButton onClick={() => chatSystem.createThread(channelId, message.id)}>
                💬 Reply in Thread
              </ThreadButton>
            )}
          </MessageActions>
        </MessageGroup>
      ))}
    </Container>
  );
}; 