import React from 'react';
import styled from 'styled-components';

const MessageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${({ $isOwn }) => $isOwn ? 'flex-end' : 'flex-start'};
  margin: ${({ theme }) => theme.space?.sm || '8px'} 0;
  padding: 0 ${({ theme }) => theme.space?.md || '16px'};
`;

const MessageBubble = styled.div`
  background: ${({ $isOwn, theme }) => $isOwn ? theme.colors?.primary || '#007AFF' : theme.colors?.surface || '#F0F0F0'};
  color: ${({ $isOwn, theme }) => $isOwn ? theme.colors?.onPrimary || '#FFFFFF' : theme.colors?.text || '#000000'};
  padding: ${({ theme }) => theme.space?.sm || '8px'} ${({ theme }) => theme.space?.md || '16px'};
  border-radius: ${({ theme }) => theme.borderRadius?.large || '12px'};
  max-width: 70%;
  word-wrap: break-word;
`;

const MessageMeta = styled.div`
  font-size: ${({ theme }) => theme.fontSizes?.xs || '12px'};
  color: ${({ theme }) => theme.colors?.textAlt || '#666'};
  margin-top: ${({ theme }) => theme.space?.xs || '4px'};
`;

const Username = styled.span`
  font-weight: ${({ theme }) => theme.fontWeights?.medium || 500};
  margin-right: ${({ theme }) => theme.space?.xs || '4px'};
`;

const Timestamp = styled.span`
  opacity: 0.8;
`;

const FileAttachment = styled.div`
  margin-top: ${({ theme }) => theme.space?.xs || '4px'};
  padding: ${({ theme }) => theme.space?.xs || '4px'} ${({ theme }) => theme.space?.sm || '8px'};
  background: ${({ theme }) => theme.colors?.surfaceAlt || '#F5F5F5'};
  border-radius: ${({ theme }) => theme.borderRadius?.small || '4px'};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space?.xs || '4px'};
`;

const FileIcon = styled.span`
  font-size: 1.2em;
`;

const FileName = styled.a`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textAlt};
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

function formatTime(timestamp) {
  if (!timestamp) return '';
  
  const date = timestamp.toDate();
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffInHours < 48) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString();
  }
}

export function BasicMessage({ message, $isOwn, onThreadClick }) {
  const { text, userName, timestamp, fileUrl, fileName } = message;

  return (
    <MessageContainer $isOwn={$isOwn}>
      <MessageBubble $isOwn={$isOwn}>
        {text}
        {fileUrl && (
          <FileAttachment>
            <FileIcon>📎</FileIcon>
            <FileName href={fileUrl} target="_blank" rel="noopener noreferrer">
              {fileName}
            </FileName>
          </FileAttachment>
        )}
      </MessageBubble>
      <MessageMeta>
        <Username>{userName}</Username>
        <Timestamp>{formatTime(timestamp)}</Timestamp>
      </MessageMeta>
    </MessageContainer>
  );
} 