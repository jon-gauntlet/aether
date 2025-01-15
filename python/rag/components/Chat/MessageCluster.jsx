import React, { useMemo } from 'react';
import styled from 'styled-components';
import { Message } from './Message';
import { SpacePatterns } from '../../core/spaces/SpacePatterns';

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

function calculateResonanceStrength(msg1, msg2, spaceType) {
  if (!msg1.resonance || !msg2.resonance) return 0;
  
  const pattern = SpacePatterns[spaceType];
  if (!pattern) return 0;

  const timeDiff = msg2.timestamp - msg1.timestamp;
  const timeDecay = Math.exp(-timeDiff / (1000 * 60 * 5)); // 5 minute decay

  const resonance1 = pattern.resonanceCalculation(msg1, { energy: 1, presence: [] }, 1);
  const resonance2 = pattern.resonanceCalculation(msg2, { energy: 1, presence: [] }, 1);

  return Math.min(resonance1 * resonance2 * timeDecay, 1);
}

export function MessageCluster({ messages, spaceType }) {
  const { clusters, clusterResonance } = useMemo(() => {
    if (!messages.length) return { clusters: [], clusterResonance: 0 };

    // Group messages by resonance strength
    const clusters = [];
    let currentCluster = [messages[0]];
    let totalResonance = 0;

    for (let i = 1; i < messages.length; i++) {
      const strength = calculateResonanceStrength(
        messages[i - 1],
        messages[i],
        spaceType
      );
      
      totalResonance += strength;

      if (strength > 0.3) {
        currentCluster.push(messages[i]);
      } else {
        if (currentCluster.length > 0) {
          clusters.push([...currentCluster]);
        }
        currentCluster = [messages[i]];
      }
    }

    if (currentCluster.length > 0) {
      clusters.push(currentCluster);
    }

    const avgResonance = totalResonance / (messages.length - 1 || 1);

    return {
      clusters,
      clusterResonance: avgResonance
    };
  }, [messages, spaceType]);

  return (
    <>
      {clusters.map((cluster, clusterIndex) => (
        <ClusterContainer 
          key={`cluster-${clusterIndex}`}
          resonance={clusterResonance}
        >
          <ResonanceIndicator 
            resonance={clusterResonance}
            strength={cluster.length / messages.length}
          />
          {cluster.map((message, messageIndex) => {
            const nextMessage = cluster[messageIndex + 1];
            const strength = nextMessage 
              ? calculateResonanceStrength(message, nextMessage, spaceType)
              : 0;

            return (
              <React.Fragment key={message.id}>
                <Message message={message} isOwn={message.isOwn} />
                {strength > 0 && messageIndex < cluster.length - 1 && (
                  <ClusterLine
                    fromX={message.isOwn ? 90 : 10}
                    fromY={50}
                    width={20}
                    angle={message.isOwn ? -30 : 30}
                    strength={strength}
                  />
                )}
              </React.Fragment>
            );
          })}
        </ClusterContainer>
      ))}
    </>
  );
} 