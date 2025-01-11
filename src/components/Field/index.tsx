import React from 'react'
import styled from 'styled-components'
import { StyledContainerProps } from '@/components/shared/types'

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
  border-radius: 1rem;
  background: ${({ theme }) => theme.colors.background};
  transition: all 0.3s ease-in-out;
  transform: scale(${({ isActive }) => (isActive ? 1.05 : 1)});
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: scale(1.02);
  }
`

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  width: 100%;
  margin-top: 1rem;
`

const Metric = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: 0.5rem;
  transition: transform 0.2s ease;

  &:hover {
    transform: translateY(-2px);
  }
`

const Value = styled.span`
  font-size: 1.5rem;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.primary};
`

const Label = styled.span`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text};
  margin-top: 0.5rem;
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