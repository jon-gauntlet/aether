import React from 'react'
import styled from 'styled-components'
import { StyledContainerProps } from '@/components/shared/types'
import { pulseAnimation, spiralAnimation, timing } from '@/styles/animations'

interface Metric {
  value: number
  label: string
}

interface FieldProps extends StyledContainerProps {
  metrics?: Metric[]
}

const FieldContainer = styled.div<StyledContainerProps>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  border-radius: 1.618rem;
  background: ${({ theme }) => theme.colors.background};
  transition: all ${timing.normal} ${timing.easings.natural};
  transform: scale(${({ isActive }) => (isActive ? 1.618 : 1)});
  box-shadow: ${({ theme }) => theme.shadows.medium};
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
      ${({ theme }) => theme.colors.primary}15 0%,
      ${({ theme }) => theme.colors.secondary}15 100%
    );
    animation: ${spiralAnimation} ${timing.slow} ${timing.easings.gentle} infinite;
    z-index: 0;
  }

  &:hover {
    transform: scale(1.0618);
  }
`

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1.618rem;
  width: 100%;
  margin-top: 1.618rem;
  position: relative;
  z-index: 1;
`

const Metric = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.618rem;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: 0.618rem;
  transition: transform ${timing.fast} ${timing.easings.smooth};
  animation: ${pulseAnimation} ${timing.normal} ${timing.easings.natural} infinite;
  animation-delay: ${() => Math.random() * timing.normal};

  &:hover {
    transform: translateY(-0.618rem);
  }
`

const Value = styled.span`
  font-size: 1.618rem;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.primary};
`

const Label = styled.span`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text};
  margin-top: 0.618rem;
  opacity: 0.618;
`

export const FieldComponent: React.FC<FieldProps> = ({ isActive = false, metrics = [] }) => {
  return (
    <FieldContainer data-testid="field-container" isActive={isActive}>
      <MetricsGrid>
        {metrics.map((metric, index) => (
          <Metric key={index}>
            <Value>{metric.value}</Value>
            <Label>{metric.label}</Label>
          </Metric>
        ))}
      </MetricsGrid>
    </FieldContainer>
  )
} 