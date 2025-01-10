import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Channel, ChatSystem } from '../../core/chat/ChatSystem';

interface ChannelListProps {
  chatSystem: ChatSystem;
  activeChannelId?: string;
  onChannelSelect: (channelId: string) => void;
}

const Container = styled.div`
  width: 240px;
  background: #2c2c2c;
  color: #e0e0e0;
  padding: 16px 0;
  height: 100%;
  overflow-y: auto;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  margin-bottom: 8px;

  h3 {
    font-size: 16px;
    font-weight: 500;
    margin: 0;
    color: #a0a0a0;
  }
`;

const AddChannelButton = styled.button`
  background: none;
  border: none;
  color: #a0a0a0;
  font-size: 20px;
  cursor: pointer;
  padding: 0 4px;

  &:hover {
    color: #ffffff;
  }
`;

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

interface ChannelItemProps {
  active: boolean;
}

const ChannelItem = styled.li<ChannelItemProps>`
  padding: 4px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: ${props => props.active ? '#ffffff' : '#a0a0a0'};
  background: ${props => props.active ? '#4c4c4c' : 'transparent'};

  &:hover {
    background: #3c3c3c;
    color: #ffffff;
  }
`;

const ChannelPrefix = styled.span`
  margin-right: 4px;
  font-weight: 500;
`;

const UserStatusIndicator = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #43b581;
  margin-right: 8px;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: #2c2c2c;
  padding: 24px;
  border-radius: 8px;
  width: 400px;

  h3 {
    margin: 0 0 16px;
    color: #ffffff;
  }

  input {
    width: 100%;
    padding: 8px;
    margin-bottom: 16px;
    background: #3c3c3c;
    border: 1px solid #4c4c4c;
    border-radius: 4px;
    color: #ffffff;
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;

  button {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;

    &:first-child {
      background: #3c3c3c;
      color: #ffffff;
    }

    &:last-child {
      background: #5865f2;
      color: #ffffff;
    }
  }
`;

export const ChannelList: React.FC<ChannelListProps> = ({
  chatSystem,
  activeChannelId,
  onChannelSelect
}) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');

  useEffect(() => {
    const subscription = chatSystem.observeChat().subscribe(state => {
      setChannels(state.channels);
    });

    return () => subscription.unsubscribe();
  }, [chatSystem]);

  const handleCreateChannel = () => {
    if (newChannelName.trim()) {
      chatSystem.createChannel(
        newChannelName.trim(),
        'channel',
        [], // Initial members
        '' // Optional description
      );
      setNewChannelName('');
      setShowCreateModal(false);
    }
  };

  const publicChannels = channels.filter(c => c.type === 'channel');
  const directMessages = channels.filter(c => c.type === 'dm');

  return (
    <Container>
      {/* Channels Section */}
      <div>
        <SectionHeader>
          <h3>Channels</h3>
          <AddChannelButton onClick={() => setShowCreateModal(true)}>
            +
          </AddChannelButton>
        </SectionHeader>
        <List>
          {publicChannels.map(channel => (
            <ChannelItem
              key={channel.id}
              active={activeChannelId === channel.id}
              onClick={() => onChannelSelect(channel.id)}
            >
              <ChannelPrefix>#</ChannelPrefix>
              <span>{channel.name}</span>
            </ChannelItem>
          ))}
        </List>
      </div>

      {/* Direct Messages Section */}
      <div>
        <SectionHeader>
          <h3>Direct Messages</h3>
        </SectionHeader>
        <List>
          {directMessages.map(channel => (
            <ChannelItem
              key={channel.id}
              active={activeChannelId === channel.id}
              onClick={() => onChannelSelect(channel.id)}
            >
              <UserStatusIndicator />
              <span>{channel.name}</span>
            </ChannelItem>
          ))}
        </List>
      </div>

      {/* Create Channel Modal */}
      {showCreateModal && (
        <ModalOverlay>
          <ModalContent>
            <h3>Create Channel</h3>
            <input
              type="text"
              value={newChannelName}
              onChange={e => setNewChannelName(e.target.value)}
              placeholder="Channel name"
              autoFocus
            />
            <ModalActions>
              <button onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button onClick={handleCreateChannel}>Create</button>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
}; 