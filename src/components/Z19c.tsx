import React, { useState, useEffect } from 'react';
import { Channel, ChatSystem } from '../../core/chat/ChatSystem';
import { useNaturalSystem } from '../../core/system/NaturalSystem';

interface ChannelListProps {
  chatSystem: ChatSystem;
  activeChannelId?: string;
  onChannelSelect: (channelId: string) => void;
}

export const ChannelList: React.FC<ChannelListProps> = ({
  chatSystem,
  activeChannelId,
  onChannelSelect
}) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const naturalSystem = useNaturalSystem();

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
    <div className="channel-list">
      {/* Channels Section */}
      <div className="channels-section">
        <div className="section-header">
          <h3>Channels</h3>
          <button
            className="add-channel"
            onClick={() => setShowCreateModal(true)}
          >
            +
          </button>
        </div>
        <ul>
          {publicChannels.map(channel => (
            <li
              key={channel.id}
              className={`channel-item ${activeChannelId === channel.id ? 'active' : ''}`}
              onClick={() => onChannelSelect(channel.id)}
            >
              <span className="channel-prefix">#</span>
              <span className="channel-name">{channel.name}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Direct Messages Section */}
      <div className="dm-section">
        <div className="section-header">
          <h3>Direct Messages</h3>
        </div>
        <ul>
          {directMessages.map(channel => (
            <li
              key={channel.id}
              className={`dm-item ${activeChannelId === channel.id ? 'active' : ''}`}
              onClick={() => onChannelSelect(channel.id)}
            >
              <div className="user-status-indicator" />
              <span className="dm-name">{channel.name}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Create Channel Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Create Channel</h3>
            <input
              type="text"
              value={newChannelName}
              onChange={e => setNewChannelName(e.target.value)}
              placeholder="Channel name"
              autoFocus
            />
            <div className="modal-actions">
              <button onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button onClick={handleCreateChannel}>Create</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .channel-list {
          width: 240px;
          background: #2c2c2c;
          color: #e0e0e0;
          padding: 16px 0;
          height: 100%;
          overflow-y: auto;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 16px;
          margin-bottom: 8px;
        }

        .section-header h3 {
          font-size: 16px;
          font-weight: 500;
          margin: 0;
          color: #a0a0a0;
        }

        .add-channel {
          background: none;
          border: none;
          color: #a0a0a0;
          font-size: 20px;
          cursor: pointer;
          padding: 0 4px;
        }

        .add-channel:hover {
          color: #ffffff;
        }

        ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .channel-item,
        .dm-item {
          padding: 4px 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          color: #a0a0a0;
        }

        .channel-item:hover,
        .dm-item:hover {
          background: #3c3c3c;
          color: #ffffff;
        }

        .active {
          background: #4c4c4c;
          color: #ffffff;
        }

        .channel-prefix {
          margin-right: 4px;
          font-weight: 500;
        }

        .user-status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #43b581;
          margin-right: 8px;
        }

        .modal-overlay {
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
        }

        .modal-content {
          background: #2c2c2c;
          padding: 24px;
          border-radius: 8px;
          width: 400px;
        }

        .modal-content h3 {
          margin: 0 0 16px;
          color: #ffffff;
        }

        .modal-content input {
          width: 100%;
          padding: 8px;
          margin-bottom: 16px;
          background: #3c3c3c;
          border: 1px solid #4c4c4c;
          border-radius: 4px;
          color: #ffffff;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        .modal-actions button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .modal-actions button:first-child {
          background: #3c3c3c;
          color: #ffffff;
        }

        .modal-actions button:last-child {
          background: #5865f2;
          color: #ffffff;
        }
      `}</style>
    </div>
  );
}; 