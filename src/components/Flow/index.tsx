import React from 'react'
import styled, { keyframes } from 'styled-components'
import { StyledContainerProps } from '@/components/shared/types'

interface FlowProps extends StyledContainerProps {
  flowIntensity?: number
  isInFlow?: boolean
}

const flowAnimation = keyframes`
  0% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-10px) scale(1.02); }
  100% { transform: translateY(0) scale(1); }
`

const FlowContainer = styled.div<StyledContainerProps>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  border-radius: 1rem;
  background: ${({ theme }) => theme.colors.background};
  transition: all ${({ theme }) => theme.transitions.normal};
  transform: scale(${({ isActive }) => (isActive ? 1.05 : 1)});
  box-shadow: ${({ theme }) => theme.shadows.medium};
  position: relative;
  overflow: hidden;

  &:hover {
    transform: scale(1.02);
  }
`

const FlowField = styled.div<{ flowIntensity?: number }>`
  width: 200px;
  height: 200px;
  background: linear-gradient(
    45deg,
    ${({ theme }) => theme.colors.primary} 0%,
    ${({ theme }) => theme.colors.secondary} 100%
  );
  border-radius: 1rem;
  opacity: ${({ flowIntensity }) => (flowIntensity ? flowIntensity / 100 : 0.5)};
  animation: ${flowAnimation} 3s ease-in-out infinite;
`

const FlowIntensity = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.text};
  margin-top: 1rem;
`

const FlowIndicator = styled.div<{ isInFlow?: boolean; flowIntensity?: number }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: ${({ theme }) => theme.colors.accent};
  opacity: ${({ isInFlow, flowIntensity }) =>
    isInFlow && flowIntensity ? flowIntensity / 100 : 0.2};
  transition: opacity ${({ theme }) => theme.transitions.fast};
`

export const FlowComponent: React.FC<FlowProps> = ({
  flowIntensity = 50,
  isInFlow = false,
}) => {
  return (
    <FlowContainer data-testid="flow-container" isActive={isInFlow}>
      <FlowIndicator
        data-testid="flow-indicator"
        isInFlow={isInFlow}
        flowIntensity={flowIntensity}
      />
      <FlowField flowIntensity={flowIntensity} />
      <FlowIntensity>{flowIntensity}</FlowIntensity>
      <span>Flow Intensity</span>
    </FlowContainer>
  )
} 