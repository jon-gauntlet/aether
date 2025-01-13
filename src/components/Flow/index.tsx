import React from 'react';
import styled, { keyframes } from 'styled-components';
import { StyledContainerProps } from '@/components/shared/types';

interface FlowProps extends StyledContainerProps {
  flowIntensity?: number;
  isInFlow?: boolean;
  naturalResonance?: number;
}

const GOLDEN_RATIO = 1.618033988749895;
const NATURAL_CYCLE = 8000;

const flowAnimation = keyframes`
  0% { transform: scale(1) rotate(0deg); opacity: 0.8; }
  50% { transform: scale(${GOLDEN_RATIO}) rotate(180deg); opacity: 1; }
  100% { transform: scale(1) rotate(360deg); opacity: 0.8; }
`;

const resonanceAnimation = keyframes`
  0% { filter: hue-rotate(0deg) brightness(1); }
  50% { filter: hue-rotate(180deg) brightness(${GOLDEN_RATIO}); }
  100% { filter: hue-rotate(360deg) brightness(1); }
`;

const FlowContainer = styled.div<{ isActive?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  border-radius: 1rem;
  background: ${({ theme }) => theme.colors.background};
  box-shadow: ${({ theme }) => theme.shadows.md};
  transition: all ${({ theme }) => theme.transitions.default};
  transform: scale(${({ isActive }) => (isActive ? GOLDEN_RATIO : 1)});
  position: relative;
  overflow: hidden;
`;

const FlowIndicator = styled.div<{ intensity?: number; resonance?: number }>`
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    ${({ theme }) => theme.colors.primary} 0%,
    ${({ theme }) => theme.colors.secondary} 100%
  );
  opacity: ${({ intensity }) => (intensity ? intensity / 100 : 0.5)};
  animation: ${flowAnimation} 10s linear infinite,
             ${resonanceAnimation} ${NATURAL_CYCLE}ms ease-in-out infinite;
  filter: brightness(${({ resonance }) => resonance || 1});
`;

const FlowMetrics = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  opacity: 0.8;
  transition: opacity 0.3s ease;

  &:hover {
    opacity: 1;
  }
`;

export const FlowComponent: React.FC<FlowProps> = ({
  flowIntensity,
  isInFlow,
  naturalResonance,
  ...props
}) => {
  return (
    <FlowContainer data-testid="flow-container" isActive={isInFlow} {...props}>
      <FlowIndicator
        intensity={flowIntensity}
        resonance={naturalResonance}
      />
      {flowIntensity && (
        <FlowMetrics>
          <span>{flowIntensity}</span>
          <span>Flow Intensity</span>
        </FlowMetrics>
      )}
    </FlowContainer>
  );
};

export default FlowComponent; 