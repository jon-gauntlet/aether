import React, { useState, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { useMessages } from '../../core/messaging/MessageProvider';
import { BasicMessage } from './BasicMessage';
import { useSpaces } from '../../core/spaces/SpaceProvider';
import { useAuth } from '../../core/auth/AuthProvider';

// TODO: Natural Integration Points
// 1. Space awareness - integrate with SpaceProvider
// 2. Energy fields - add ConsciousnessField
// 3. Flow protection - add natural interruption prevention
// 4. Message clustering - add resonance-based grouping
// 5. Thread energy inheritance
// 6. Presence resonance
// 7. File energy signatures

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - ${({ theme }) => theme.space.xl} * 2);
  background: ${({ theme }) => theme.colors.background};
  position: relative;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.borderRadius.large};
  border: 1px solid ${({ theme }) => theme.colors.border};
  box-shadow: 0 4px 6px ${({ theme }) => theme.colors.shadow};

  // TODO: Add natural background patterns and energy visualizations
`;

const Header = styled.div`
  padding: ${({ theme }) => theme.space?.md || '16px'};
  border-bottom: 1px solid ${({ theme }) => theme.colors?.border || '#E1E1E1'};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space?.sm || '8px'};
`;

const SignOutButton = styled.button`
  padding: ${({ theme }) => theme.space?.sm || '8px'} ${({ theme }) => theme.space?.md || '16px'};
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors?.border || '#E1E1E1'};
  border-radius: ${({ theme }) => theme.borderRadius?.medium || '6px'};
  color: ${({ theme }) => theme.colors?.textAlt || '#666'};
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSizes?.sm || '14px'};
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors?.surfaceAlt || '#F5F5F5'};
    color: ${({ theme }) => theme.colors?.text || '#000'};
  }
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const PresenceIndicator = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $active, theme }) => $active ? theme.colors?.success || '#28CD41' : theme.colors?.textAlt || '#999999'};
  margin-left: ${({ theme }) => theme.space?.xs || '4px'};

  // TODO: Add natural presence animations
`;

const ThreadView = styled.div`
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: 40%;
  background: ${({ theme }) => theme.colors.surfaceAlt};
  border-left: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;
  transform: translateX(${({ open }) => open ? '0' : '100%'});
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: ${({ open }) => open ? '-4px 0 6px' : '0 0 0'} ${({ theme }) => theme.colors.shadow};
  padding: ${({ theme }) => theme.space.md};
  gap: ${({ theme }) => theme.space.md};

  // Thread header
  &::before {
    content: 'Thread';
    display: block;
    font-size: ${({ theme }) => theme.fontSizes.lg};
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text};
    padding-bottom: ${({ theme }) => theme.space.md};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }

  // TODO: Add natural thread transitions and energy inheritance
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.space?.md || '16px'};
  width: ${({ $threadOpen }) => $threadOpen ? '60%' : '100%'};
  transition: width 0.3s ease, padding 0.3s ease;
  scroll-behavior: smooth;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space?.sm || '8px'};
  padding-bottom: ${({ theme }) => theme.space?.xl || '32px'};

  // Improved scrollbar styling
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.surfaceAlt};
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.primary}66;
    border-radius: 4px;
    
    &:hover {
      background: ${({ theme }) => theme.colors.primary};
    }
  }

  // TODO: Add natural scrolling behavior and focus protection
`;

const InputContainer = styled.form`
  display: flex;
  gap: ${({ theme }) => theme.space.sm};
  padding: ${({ theme }) => theme.space.md};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  align-items: center;
  background: ${({ theme }) => theme.colors.surfaceAlt};
  border-bottom-left-radius: ${({ theme }) => theme.borderRadius.large};
  border-bottom-right-radius: ${({ theme }) => theme.borderRadius.large};

  // TODO: Add flow protection and energy-based input control
`;

const Input = styled.input`
  flex: 1;
  padding: ${({ theme }) => theme.space.md};
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.md};
  transition: all ${({ theme }) => theme.transitions.normal};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => `${theme.colors.primary}33`};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textAlt};
  }

  // TODO: Add natural focus states and energy feedback
`;

const FileInput = styled.input`
  display: none;
`;

const FileButton = styled.button`
  padding: ${({ theme }) => theme.space.sm};
  background: ${({ theme }) => theme.colors.surface};
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  color: ${({ theme }) => theme.colors.textAlt};
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  transition: all ${({ theme }) => theme.transitions.normal};
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    border-color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.surfaceAlt};
  }

  // TODO: Add natural hover effects based on file energy
`;

const SendButton = styled.button`
  padding: ${({ theme }) => theme.space.md};
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSizes.md};
  transition: all ${({ theme }) => theme.transitions.normal};
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryDark || theme.colors.primary};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.disabled};
    cursor: not-allowed;
    transform: none;
  }

  // TODO: Add energy-based button states
`;

// Add close button for thread
const CloseThreadButton = styled.button`
  position: absolute;
  top: ${({ theme }) => theme.space.sm};
  right: ${({ theme }) => theme.space.sm};
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textAlt};
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSizes.xl};
  padding: ${({ theme }) => theme.space.xs};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all ${({ theme }) => theme.transitions.normal};
  border-radius: ${({ theme }) => theme.borderRadius.medium};

  &:hover {
    color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => theme.colors.surface};
  }
`;

// Add styled components for auth form
const AuthForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px;
  max-width: 300px;
  margin: 0 auto;
`;

const AuthInput = styled.input`
  padding: 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  font-size: 14px;
`;

const AuthButton = styled.button`
  padding: 10px;
  border: none;
  border-radius: 4px;
  background: ${({ theme, google }) => google ? '#4285f4' : theme.colors.primary};
  color: white;
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    opacity: 0.9;
  }
`;

const AuthError = styled.div`
  color: #d32f2f;
  font-size: 14px;
  text-align: center;
  background: #ffebee;
  padding: 8px;
  border-radius: 4px;
  margin: 8px 0;
`;

export function BasicChat() {
  const [inputValue, setInputValue] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeThread, setActiveThread] = useState(null);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  
  const { messages, threads, sendMessage, loadThread, loading } = useMessages();
  const { currentSpace } = useSpaces();
  const { user, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut, error: authError } = useAuth();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // TODO: Add hooks for:
  // 1. Space context
  // 2. Energy tracking
  // 3. Flow protection
  // 4. Natural presence
  // 5. Thread resonance
  // 6. File signatures

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // TODO: Add natural scroll behavior based on flow state
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted');
    setError(null);
    
    try {
      console.log('Current state:', { inputValue, selectedFile, loading });
      
      if (!inputValue.trim() && !selectedFile) {
        console.log('No content to send');
        setError('Please enter a message or select a file');
        return;
      }

      if (loading) {
        console.log('Already sending a message');
        setError('Please wait, previous message is still sending...');
        return;
      }

      if (selectedFile && selectedFile.size > 10 * 1024 * 1024) {
        console.log('File too large:', selectedFile.size);
        setError('File size must be less than 10MB');
        return;
      }

      console.log('Starting message send...');
      await sendMessage(
        inputValue || '',
        currentSpace?.type || 'Commons',
        selectedFile
      );
      
      console.log('Message sent successfully');
      setInputValue('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      scrollToBottom();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setError(error.message || 'Failed to send message');
    }
  };

  const handleFileSelect = (e) => {
    console.log('File input changed');
    const file = e.target.files?.[0];
    console.log('Selected file:', file);
    
    if (!file) {
      console.log('No file selected');
      setSelectedFile(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      console.log('File too large:', file.size);
      setError('File size must be less than 10MB');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    console.log('File accepted:', file.name);
    setError(null);
    setSelectedFile(file);
  };

  const handleThreadClick = async (messageId) => {
    if (activeThread === messageId) {
      setActiveThread(null);
    } else {
      setActiveThread(messageId);
      await loadThread(messageId);
    }
    // TODO: Add natural thread transitions
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
      setEmail('');
      setPassword('');
    } catch (error) {
      console.error('Auth error:', error);
      if (error.code === 'auth/operation-not-allowed') {
        setError('Email/Password sign-in is not enabled. Please use Google Sign-in or contact the administrator.');
      }
    }
  };

  return (
    <ChatContainer>
      <Header>
        <HeaderLeft>
          <Title>Chat {loading && '(Sending...)'}</Title>
          <PresenceIndicator $active={!loading} />
        </HeaderLeft>
        {user && (
          <SignOutButton onClick={signOut}>
            Sign Out
          </SignOutButton>
        )}
      </Header>
      
      {!user ? (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Please sign in to chat</h2>
          
          <AuthForm onSubmit={handleAuth}>
            <AuthInput
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <AuthInput
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <AuthError>{error}</AuthError>}
            {authError && <AuthError>{authError}</AuthError>}
            <AuthButton type="submit">
              {isSignUp ? 'Sign Up' : 'Sign In'} with Email
            </AuthButton>
            <div style={{ textAlign: 'center', margin: '10px 0' }}>
              <span style={{ cursor: 'pointer', color: '#4285f4' }} onClick={() => setIsSignUp(!isSignUp)}>
                {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
              </span>
            </div>
          </AuthForm>
          
          <div style={{ margin: '20px 0' }}>
            <div style={{ margin: '10px 0', color: '#666' }}>- OR -</div>
            <AuthButton type="button" google onClick={signInWithGoogle}>
              Sign in with Google
            </AuthButton>
          </div>
        </div>
      ) : (
        <>
          {error && (
            <div style={{ 
              padding: '10px', 
              margin: '10px', 
              backgroundColor: '#ff00001a', 
              color: 'red',
              borderRadius: '4px'
            }}>
              Error: {error}
            </div>
          )}

          <MessagesContainer $threadOpen={!!activeThread}>
            {messages.map((message) => (
              <BasicMessage
                key={message.id}
                message={message}
                $isOwn={message.isOwn}
                onThreadClick={() => handleThreadClick(message.id)}
              />
            ))}
            <div ref={messagesEndRef} />
          </MessagesContainer>

          {activeThread && (
            <ThreadView open={!!activeThread}>
              <CloseThreadButton onClick={() => setActiveThread(null)}>×</CloseThreadButton>
              {threads[activeThread]?.map((message) => (
                <BasicMessage
                  key={message.id}
                  message={message}
                  $isOwn={message.isOwn}
                />
              ))}
            </ThreadView>
          )}

          <InputContainer onSubmit={handleSubmit}>
            <FileInput
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
            />
            <FileButton
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title={selectedFile ? `Selected: ${selectedFile.name}` : "Attach file"}
              disabled={loading}
            >
              {loading ? '⏳' : selectedFile ? '📄' : '📎'}
            </FileButton>
            <Input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={loading ? 'Sending...' : selectedFile ? `${selectedFile.name} selected...` : "Type a message..."}
              disabled={loading}
            />
            <SendButton 
              type="submit"
              disabled={(!inputValue.trim() && !selectedFile) || loading}
              title={loading ? "Sending..." : "Send message"}
            >
              {loading ? '⏳' : '➤'}
            </SendButton>
          </InputContainer>
        </>
      )}
    </ChatContainer>
  );
} 