import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useSpaces } from '../../core/spaces/SpaceProvider';

const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
`;

const fadeOut = keyframes`
  from { opacity: 1; transform: scale(1); }
  to { opacity: 0; transform: scale(1.05); }
`;

const TransitionOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${({ theme }) => theme.colors.background};
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: ${({ isExiting }) => isExiting ? fadeOut : fadeIn} 0.5s ease-in-out;
  pointer-events: none;
`;

const TransitionContent = styled.div`
  text-align: center;
  color: ${({ theme }) => theme.colors.text};
`;

const SpaceName = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.xxl};
  margin: 0;
  opacity: 0.8;
`;

const EnergyField = styled.div`
  width: 200px;
  height: 200px;
  margin: ${({ theme }) => theme.space.lg} auto;
  border-radius: 50%;
  background: ${({ theme, energy }) => `
    radial-gradient(
      circle,
      ${theme.colors.primary}${Math.floor(energy * 255).toString(16)} 0%,
      transparent 70%
    )
  `};
  animation: pulse 2s ease-in-out infinite;

  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
`;

const PresenceIndicator = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textAlt};
  margin-top: ${({ theme }) => theme.space.md};
`;

const TransitionMetrics = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space.lg};
  justify-content: center;
  margin-top: ${({ theme }) => theme.space.xl};
`;

const Metric = styled.div`
  text-align: center;
`;

const MetricValue = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: bold;
  color: ${({ theme }) => theme.colors.primary};
`;

const MetricLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textAlt};
  margin-top: ${({ theme }) => theme.space.xs};
`;

export function SpaceTransition() {
  const { currentSpace, transitioning } = useSpaces();
  const [isExiting, setIsExiting] = useState(false);
  const [showTransition, setShowTransition] = useState(false);

  useEffect(() => {
    if (transitioning) {
      setShowTransition(true);
      setIsExiting(false);
    } else if (showTransition) {
      setIsExiting(true);
      setTimeout(() => setShowTransition(false), 500);
    }
  }, [transitioning]);

  if (!showTransition) return null;

  return (
    <TransitionOverlay isExiting={isExiting}>
      <TransitionContent>
        <SpaceName>{currentSpace?.type}</SpaceName>
        <EnergyField energy={currentSpace?.energy || 0} />
        <PresenceIndicator>
          {currentSpace?.presence?.length || 0} present
        </PresenceIndicator>
        <TransitionMetrics>
          <Metric>
            <MetricValue>
              {Math.round((currentSpace?.energy || 0) * 100)}%
            </MetricValue>
            <MetricLabel>Energy</MetricLabel>
          </Metric>
          <Metric>
            <MetricValue>
              {currentSpace?.presence?.length || 0}
            </MetricValue>
            <MetricLabel>Presence</MetricLabel>
          </Metric>
          <Metric>
            <MetricValue>
              {Math.round((currentSpace?.resonance || 0) * 100)}%
            </MetricValue>
            <MetricLabel>Resonance</MetricLabel>
          </Metric>
        </TransitionMetrics>
      </TransitionContent>
    </TransitionOverlay>
  );
} 