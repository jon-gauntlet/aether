import React, { useMemo } from 'react';
import styled from 'styled-components';

const ClusterContainer = styled.div`
  position: relative;
  margin: ${({ theme }) => theme.space.md} 0;
  padding: ${({ theme }) => theme.space.sm};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  background: ${({ theme, resonance }) => `
    linear-gradient(
      135deg,
      ${theme.colors.background}00,
      ${theme.colors.primary}${Math.floor(resonance * 15).toString(16)}
    )
  `};
  transition: all ${({ theme }) => theme.transitions.normal};
`;

const ClusterLine = styled.div`
  position: absolute;
  left: ${({ fromX }) => fromX}%;
  top: ${({ fromY }) => fromY}%;
  width: ${({ width }) => width}px;
  height: 1px;
  background: ${({ theme, strength }) => `${theme.colors.primary}${Math.floor(strength * 40).toString(16)}`};
  transform: rotate(${({ angle }) => angle}deg);
  transform-origin: left center;
  opacity: ${({ strength }) => strength};
  transition: all ${({ theme }) => theme.transitions.normal};
`;

const ResonanceIndicator = styled.div`
  position: absolute;
  left: -10px;
  top: 50%;
  width: 4px;
  height: ${({ strength }) => Math.max(strength * 40, 10)}px;
  background: ${({ theme, resonance }) => {
    if (resonance > 0.7) return theme.colors.success;
    if (resonance > 0.3) return theme.colors.warning;
    return theme.colors.error;
  }};
  border-radius: 2px;
  transform: translateY(-50%);
  opacity: 0.7;
  transition: all ${({ theme }) => theme.transitions.normal};
`;

function calculateResonance(messages) {
  if (!messages?.length) return 0;
  
  // Calculate average RAG context score
  const scores = messages
    .filter(msg => msg.ragContext)
    .map(msg => msg.ragContext.score || 0);
  
  if (!scores.length) return 0;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

function calculateConnections(messages) {
  const connections = [];
  
  messages.forEach((msg1, i) => {
    if (!msg1.ragContext) return;
    
    messages.slice(i + 1).forEach(msg2 => {
      if (!msg2.ragContext) return;
      
      const similarity = Math.min(msg1.ragContext.score || 0, msg2.ragContext.score || 0);
      if (similarity < 0.3) return;
      
      connections.push({
        from: msg1.id,
        to: msg2.id,
        strength: similarity
      });
    });
  });
  
  return connections;
}

export function MessageCluster({ messages = [], spaceType }) {
  const resonance = useMemo(() => calculateResonance(messages), [messages]);
  const connections = useMemo(() => calculateConnections(messages), [messages]);
  
  if (!messages.length) return null;
  
  return (
    <ClusterContainer resonance={resonance}>
      <ResonanceIndicator 
        strength={resonance} 
        resonance={resonance}
      />
      
      {connections.map((connection, index) => {
        const fromEl = document.querySelector(`[data-message-id="${connection.from}"]`);
        const toEl = document.querySelector(`[data-message-id="${connection.to}"]`);
        
        if (!fromEl || !toEl) return null;
        
        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();
        
        const fromX = (fromRect.left + fromRect.width / 2);
        const fromY = (fromRect.top + fromRect.height / 2);
        const toX = (toRect.left + toRect.width / 2);
        const toY = (toRect.top + toRect.height / 2);
        
        const angle = Math.atan2(toY - fromY, toX - fromX) * 180 / Math.PI;
        const width = Math.sqrt(Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2));
        
        return (
          <ClusterLine
            key={index}
            fromX={fromX}
            fromY={fromY}
            width={width}
            angle={angle}
            strength={connection.strength}
          />
        );
      })}
    </ClusterContainer>
  );
} 