import React, { useState } from 'react';
import styled from 'styled-components';
import { ChatSystem, User } from '../../core/chat/ChatSystem';
import { ChannelList } from './ChannelList';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

interface ChatLayoutProps {
  chatSystem: ChatSystem;
  currentUser: User;
}

const Container = styled.div`
  display: flex;
  height: 100vh;
  background: #1c1c1c;
  color: #ffffff;
`;

const Sidebar = styled.div`
  width: 240px;
  background: #2c2c2c;
  display: flex;
  flex-direction: column;
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const ThreadSidebar = styled.div`
  width: 320px;
  background: #2c2c2c;
  display: flex;
  flex-direction: column;
  border-left: 1px solid #1c1c1c;
`;

const Header = styled.div`
  height: 48px;
  padding: 0 16px;
  background: #363636;
  border-bottom: 1px solid #1c1c1c;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ChannelName = styled.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #ffffff;
`;

const ThreadHeader = styled(Header)`
  background: #2c2c2c;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #a0a0a0;
  cursor: pointer;
  padding: 4px;
  font-size: 20px;

  &:hover {
    color: #ffffff;
  }
`;

const Content = styled.div`
  flex: 1;
  display: flex;
  min-height: 0;
`;

const MessageContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

export const ChatLayout: React.FC<ChatLayoutProps> = ({
  chatSystem,
  currentUser
}) => {
  const [activeChannelId, setActiveChannelId] = useState<string>();
  const [activeThreadId, setActiveThreadId] = useState<string>();

  const handleChannelSelect = (channelId: string) => {
    setActiveChannelId(channelId);
    setActiveThreadId(undefined);
  };

  const handleThreadSelect = (threadId: string) => {
    setActiveThreadId(threadId);
  };

  const handleCloseThread = () => {
    setActiveThreadId(undefined);
  };

  return (
    <Container>
      <Sidebar>
        <ChannelList
          chatSystem={chatSystem}
          activeChannelId={activeChannelId}
          onChannelSelect={handleChannelSelect}
        />
      </Sidebar>

      <MainContent>
        {activeChannelId ? (
          <>
            <Header>
              <ChannelName>
                # {chatSystem.observeChat().value.channels.find(c => c.id === activeChannelId)?.name}
              </ChannelName>
            </Header>
            <Content>
              <MessageContainer>
                <MessageList
                  chatSystem={chatSystem}
                  channelId={activeChannelId}
                  currentUser={currentUser}
                />
                <MessageInput
                  chatSystem={chatSystem}
                  channelId={activeChannelId}
                  userId={currentUser.id}
                />
              </MessageContainer>

              {activeThreadId && (
                <ThreadSidebar>
                  <ThreadHeader>
                    <ChannelName>Thread</ChannelName>
                    <CloseButton onClick={handleCloseThread}>×</CloseButton>
                  </ThreadHeader>
                  <MessageList
                    chatSystem={chatSystem}
                    channelId={activeChannelId}
                    threadId={activeThreadId}
                    currentUser={currentUser}
                  />
                  <MessageInput
                    chatSystem={chatSystem}
                    channelId={activeChannelId}
                    threadId={activeThreadId}
                    userId={currentUser.id}
                  />
                </ThreadSidebar>
              )}
            </Content>
          </>
        ) : (
          <div style={{ padding: 16 }}>
            Select a channel to start chatting
          </div>
        )}
      </MainContent>
    </Container>
  );
}; 