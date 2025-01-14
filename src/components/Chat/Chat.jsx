import React, { useState, useEffect, useRef, useMemo } from 'react';
import styled from 'styled-components';
import { useMessages } from '../../core/messaging/MessageProvider';
import { useSpaces } from '../../core/spaces/SpaceProvider';
import { SpaceList } from './SpaceList';
import { Message } from './Message';
import { SpaceTransition } from './SpaceTransition';
import { ConsciousnessField } from './ConsciousnessField';
import { calculateAttentionMetrics } from '../../core/attention-metrics';
import { MessageCluster } from './MessageCluster';

const ChatLayout = styled.div`
  display: flex;
  height: 100vh;
  background: ${({ theme }) => theme.colors.background};
`;

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  background: ${({ theme }) => theme.colors.surface};
  padding: ${({ theme }) => theme.space.lg};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      45deg,
      ${({ theme, energy }) => `${theme.colors.primary}${Math.floor(energy * 20).toString(16)}`},
      transparent
    );
    opacity: ${({ isProtected }) => isProtected ? 0.1 : 0};
    transition: opacity 0.3s ease;
    pointer-events: none;
  }
`;

const SpaceHeader = styled.div`
  padding: ${({ theme }) => theme.space.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
`;

const SpaceTitle = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
`;

const SpaceEnergy = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ energy, theme }) => {
    if (energy > 0.7) return theme.colors.success;
    if (energy > 0.3) return theme.colors.warning;
    return theme.colors.error;
  }};
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  margin: ${({ theme }) => theme.space.md} 0;
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
  padding: ${({ theme }) => theme.space.md};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  opacity: ${({ isProtected }) => isProtected ? 0.5 : 1};
  pointer-events: ${({ isProtected }) => isProtected ? 'none' : 'auto'};
  position: relative;

  &::before {
    content: ${({ isProtected }) => isProtected ? '"Flow Protection Active"' : '""'};
    position: absolute;
    top: -20px;
    left: 50%;
    transform: translateX(-50%);
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.warning};
    white-space: nowrap;
  }
`;

const Input = styled.input`
  flex: 1;
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
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

const PresenceCount = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textAlt};
  background: ${({ theme }) => `${theme.colors.primary}22`};
  padding: ${({ theme }) => `${theme.space.xs} ${theme.space.sm}`};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.xs};

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.primary};
  }
`;

export function Chat() {
  const [inputValue, setInputValue] = useState('');
  const { messages, sendMessage, systemResonance } = useMessages();
  const { currentSpace, energySubject, transitioning } = useSpaces();
  const messagesEndRef = useRef(null);
  const [showHistory, setShowHistory] = useState(false);

  const [metrics, setMetrics] = useState({
    focusLevel: 0,
    energyReserves: 0,
    flowEfficiency: 0
  });

  // Update metrics based on space energy and system resonance
  useEffect(() => {
    const subscription = energySubject.subscribe(energy => {
      const state = {
        focus: energy,
        energy: energy,
        flow: systemResonance,
        context: {
          clarity: currentSpace?.presence?.length ? 0.8 : 0.5,
          depth: energy > 0.7 ? 1 : energy
        }
      };
      
      setMetrics(calculateAttentionMetrics(state));
    });

    return () => subscription.unsubscribe();
  }, [energySubject, systemResonance, currentSpace]);

  const isProtected = useMemo(() => {
    return metrics.focusLevel > 0.8 || metrics.energyReserves < 0.2;
  }, [metrics]);

  // Enhanced scroll behavior that respects flow state
  const scrollToBottom = (force = false) => {
    if (force || !isProtected) {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: isProtected ? 'auto' : 'smooth' 
      });
    }
  };

  useEffect(() => {
    if (!transitioning) {
      scrollToBottom(true);
    }
  }, [currentSpace, transitioning]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Natural message filtering with fade effect
  const filteredMessages = useMemo(() => {
    if (!currentSpace) return [];
    
    return messages
      .filter(msg => msg.spaceType === currentSpace.type)
      .sort((a, b) => {
        // Prioritize high resonance messages during protected states
        if (isProtected) {
          const resonanceA = (a.resonance?.natural || 0) + (a.resonance?.harmonic || 0);
          const resonanceB = (b.resonance?.natural || 0) + (b.resonance?.harmonic || 0);
          if (Math.abs(resonanceA - resonanceB) > 0.3) {
            return resonanceB - resonanceA;
          }
        }
        return a.timestamp - b.timestamp;
      });
  }, [messages, currentSpace, isProtected]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() && currentSpace && !isProtected) {
      sendMessage(inputValue, currentSpace.type);
      setInputValue('');
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <ChatLayout>
      <SpaceList />
      <ChatContainer 
        energy={currentSpace?.energy || 0}
        isProtected={isProtected}
      >
        <ConsciousnessField />
        <SpaceHeader>
          <SpaceTitle>{currentSpace?.type || 'Loading...'}</SpaceTitle>
          <SpaceEnergy energy={currentSpace?.energy || 0} />
          {currentSpace?.presence?.length > 0 && (
            <PresenceCount>
              {currentSpace.presence.length} present
            </PresenceCount>
          )}
        </SpaceHeader>
        <MessagesContainer>
          <MessageCluster 
            messages={filteredMessages}
            spaceType={currentSpace?.type}
          />
          <div ref={messagesEndRef} />
        </MessagesContainer>
        <InputContainer onSubmit={handleSubmit} isProtected={isProtected}>
          <Input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Message ${currentSpace?.type || ''}...`}
            disabled={!currentSpace || isProtected}
          />
          <SendButton 
            type="submit" 
            disabled={!currentSpace || isProtected}
          >
            Send
          </SendButton>
        </InputContainer>
      </ChatContainer>
      <SpaceTransition />
    </ChatLayout>
  );
} 