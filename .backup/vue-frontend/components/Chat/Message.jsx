import React, { useMemo } from 'react';
import styled from 'styled-components';
import { useSpaces } from '../../core/spaces/SpaceProvider';

const MessageWrapper = styled.div`
  opacity: ${({ energyLevel }) => 0.3 + (energyLevel * 0.7)};
  transition: all ${({ theme }) => theme.transitions.normal};
`;

const MessageBubble = styled.div`
  background: ${({ isOwn, theme, resonance }) => {
    const alpha = Math.min(0.2 + (resonance * 0.8), 1);
    return isOwn 
      ? `${theme.colors.primary}${Math.floor(alpha * 255).toString(16)}`
      : `${theme.colors.surface}${Math.floor(alpha * 255).toString(16)}`;
  }};
  color: ${({ isOwn, theme }) => isOwn ? '#fff' : theme.colors.text};
  padding: ${({ theme }) => theme.space.sm} ${({ theme }) => theme.space.md};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  margin: ${({ theme }) => theme.space.xs} 0;
  max-width: 80%;
  align-self: ${({ isOwn }) => isOwn ? 'flex-end' : 'flex-start'};
  box-shadow: 0 1px 2px ${({ theme }) => theme.colors.shadow};
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
      transparent,
      ${({ theme, resonance }) => `${theme.colors.primary}${Math.floor(resonance * 40).toString(16)}`}
    );
    opacity: ${({ resonance }) => resonance};
    transition: opacity ${({ theme }) => theme.transitions.normal};
  }
`;

const MessageInfo = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textAlt};
  margin-bottom: ${({ theme }) => theme.space.xs};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.xs};
`;

const ResonanceIndicator = styled.div`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ resonance, theme }) => {
    if (resonance > 0.7) return theme.colors.success;
    if (resonance > 0.3) return theme.colors.warning;
    return theme.colors.error;
  }};
`;

const MessageContent = styled.div`
  word-wrap: break-word;
  position: relative;
  z-index: 1;
`;

export function Message({ message, isOwn }) {
  const { currentSpace } = useSpaces();
  
  const resonanceLevel = useMemo(() => {
    if (!message.resonance) return 0.5;
    
    const { natural, harmonic, flow } = message.resonance;
    const spaceBonus = message.spaceType === currentSpace?.type ? 0.2 : 0;
    
    return Math.min((natural + harmonic + flow) / 3 + spaceBonus, 1);
  }, [message.resonance, currentSpace, message.spaceType]);

  const energyLevel = useMemo(() => {
    if (!currentSpace?.energy) return 0.5;
    return currentSpace.energy;
  }, [currentSpace]);

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <MessageWrapper energyLevel={energyLevel}>
      <MessageBubble 
        isOwn={isOwn} 
        resonance={resonanceLevel}
      >
        <MessageInfo>
          <ResonanceIndicator resonance={resonanceLevel} />
          {message.userName} • {formatTime(message.timestamp)}
        </MessageInfo>
        <MessageContent>
          {message.text}
        </MessageContent>
      </MessageBubble>
    </MessageWrapper>
  );
} 