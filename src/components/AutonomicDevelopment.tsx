import React from 'react';
import styled from 'styled-components';
import { Field, FlowState } from '../core/types/base';
import { ConsciousnessState } from '../core/types/consciousness';
import { useAutonomic } from '../core/autonomic/useAutonomic';

interface AutonomicDevelopmentProps {
  field: Field;
  consciousness: ConsciousnessState;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
`;

const MetricCard = styled.div`
  padding: 15px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const MetricTitle = styled.h3`
  margin: 0;
  font-size: 1em;
  color: rgba(255, 255, 255, 0.9);
`;

const ProgressBar = styled.div<{ progress: number }>`
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${props => props.progress * 100}%;
    background: linear-gradient(90deg, #00f260 0%, #0575e6 100%);
    transition: width 0.3s ease;
  }
`;

const PatternList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const PatternItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
`;

const PatternName = styled.span`
  color: rgba(255, 255, 255, 0.9);
`;

const PatternConfidence = styled.span`
  color: rgba(255, 255, 255, 0.7);
`;

const Button = styled.button`
  padding: 12px 20px;
  background: linear-gradient(135deg, #00f260 0%, #0575e6 100%);
  border: none;
  border-radius: 6px;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.02);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const AutonomicDevelopment: React.FC<AutonomicDevelopmentProps> = ({
  field,
  consciousness
}) => {
  const {
    isActive,
    activePatterns,
    metrics,
    activate,
    detectPatterns
  } = useAutonomic(field, consciousness);

  return (
    <Container>
      <MetricsGrid>
        <MetricCard>
          <MetricTitle>Autonomy Score</MetricTitle>
          <ProgressBar
            progress={metrics.autonomyScore}
            role="progressbar"
            aria-valuenow={metrics.autonomyScore * 100}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </MetricCard>
        <MetricCard>
          <MetricTitle>Pattern Strength</MetricTitle>
          <ProgressBar
            progress={metrics.patternStrength}
            role="progressbar"
            aria-valuenow={metrics.patternStrength * 100}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </MetricCard>
        <MetricCard>
          <MetricTitle>Adaptability</MetricTitle>
          <ProgressBar
            progress={metrics.adaptability}
            role="progressbar"
            aria-valuenow={metrics.adaptability * 100}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </MetricCard>
        <MetricCard>
          <MetricTitle>Stability</MetricTitle>
          <ProgressBar
            progress={metrics.stability}
            role="progressbar"
            aria-valuenow={metrics.stability * 100}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </MetricCard>
      </MetricsGrid>

      <PatternList>
        {activePatterns.map(({ pattern, confidence }) => (
          <PatternItem key={pattern.id}>
            <PatternName>{pattern.name}</PatternName>
            <PatternConfidence>{Math.round(confidence * 100)}%</PatternConfidence>
          </PatternItem>
        ))}
      </PatternList>

      <Button onClick={isActive ? detectPatterns : activate}>
        {isActive ? 'Detect Patterns' : 'Activate Development'}
      </Button>
    </Container>
  );
}; 