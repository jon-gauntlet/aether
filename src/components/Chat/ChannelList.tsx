import React from 'react';
import styled from 'styled-components';
import { Channel } from '../../core/types/chat';

interface Props {
  channels: Channel[];
  activeChannelId?: string;
  onChannelSelect: (channelId: string) => void;
}

const Container = styled.div`
  width: 240px;
  background: ${({ theme }) => theme.colors.surface};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  overflow-y: auto;
`;

const ChannelItem = styled.div<{ isActive: boolean }>`
  padding: ${({ theme }) => theme.spacing.sm};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${({ theme, isActive }) => 
    isActive ? theme.colors.surfaceHover : 'transparent'};
  
  &:hover {
    background: ${({ theme }) => theme.colors.surfaceHover};
  }
`;

const ChannelName = styled.span`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`;

const UnreadCount = styled.span`
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.8em;
`;

const Presence = styled.div<{ isOnline: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme, isOnline }) => 
    isOnline ? theme.colors.success : theme.colors.textLight};
  margin-right: ${({ theme }) => theme.spacing.xs};
`;

export const ChannelList: React.FC<Props> = ({
  channels,
  activeChannelId,
  onChannelSelect
}) => {
  return (
    <Container>
      {channels.map((channel) => (
        <ChannelItem 
          key={channel.id}
          isActive={channel.id === activeChannelId}
          onClick={() => onChannelSelect(channel.id)}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {channel.type === 'dm' && (
              <Presence isOnline={channel.members.length > 0} />
            )}
            <ChannelName>
              {channel.type === 'dm' ? '@' : '#'}{channel.name}
            </ChannelName>
          </div>
          {channel.unreadCount ? (
            <UnreadCount>{channel.unreadCount}</UnreadCount>
          ) : null}
        </ChannelItem>
      ))}
    </Container>
  );
}; 