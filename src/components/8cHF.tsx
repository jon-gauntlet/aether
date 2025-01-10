import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ChatSystem, User } from './core/chat/ChatSystem';
import { ChatLayout } from './components/chat/ChatLayout';

const Container = styled.div`
  height: 100vh;
  background: #1c1c1c;
  color: #ffffff;
`;

const LoginContainer = styled.div`
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1c1c1c;
`;

const LoginForm = styled.form`
  width: 100%;
  max-width: 400px;
  padding: 32px;
  background: #2c2c2c;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  margin: 0 0 24px;
  font-size: 24px;
  font-weight: 500;
  color: #ffffff;
  text-align: center;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  margin-bottom: 16px;
  background: #3c3c3c;
  border: 1px solid #4c4c4c;
  border-radius: 4px;
  color: #ffffff;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #5865f2;
  }

  &::placeholder {
    color: #a0a0a0;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 12px;
  background: #5865f2;
  border: none;
  border-radius: 4px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: #4752c4;
  }

  &:disabled {
    background: #3c3c3c;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  margin-bottom: 16px;
  padding: 12px;
  background: #f04747;
  border-radius: 4px;
  color: #ffffff;
  font-size: 14px;
  text-align: center;
`;

export const App: React.FC = () => {
  const [chatSystem] = useState(() => new ChatSystem());
  const [currentUser, setCurrentUser] = useState<User>();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('chatUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        chatSystem.updateUserStatus(user.id, 'online');
      } catch (err) {
        localStorage.removeItem('chatUser');
      }
    }
  }, [chatSystem]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!username.trim()) {
        throw new Error('Please enter a username');
      }

      // In a real app, this would be an API call
      const user: User = {
        id: Math.random().toString(36).substring(7),
        name: username.trim(),
        status: 'online'
      };

      // Save user to local storage
      localStorage.setItem('chatUser', JSON.stringify(user));

      // Update chat system
      setCurrentUser(user);
      chatSystem.updateUserStatus(user.id, 'online');

      // Create default channels if they don't exist
      const state = await new Promise(resolve => {
        const subscription = chatSystem.observeChat().subscribe(state => {
          resolve(state);
          subscription.unsubscribe();
        });
      });

      if ((state as any).channels.length === 0) {
        chatSystem.createChannel('general', 'channel', [user.id], 'General discussion');
        chatSystem.createChannel('random', 'channel', [user.id], 'Random chat');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    if (currentUser) {
      chatSystem.updateUserStatus(currentUser.id, 'offline');
      localStorage.removeItem('chatUser');
      setCurrentUser(undefined);
      setUsername('');
    }
  };

  if (!currentUser) {
    return (
      <LoginContainer>
        <LoginForm onSubmit={handleLogin}>
          <Title>Welcome to ChatGenius</Title>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <Input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Enter your username"
            disabled={isLoading}
            autoFocus
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Join Chat'}
          </Button>
        </LoginForm>
      </LoginContainer>
    );
  }

  return (
    <Container>
      <ChatLayout
        chatSystem={chatSystem}
        currentUser={currentUser}
      />
    </Container>
  );
};