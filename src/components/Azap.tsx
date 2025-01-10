import React, { useCallback, useState, useEffect } from 'react';
import { PatternGuided } from './PatternGuided';
import { EnergyAware } from './EnergyAware';
import { EnergyType } from '../core/energy/types';
import { useEnergy } from '../core/energy/useEnergy';
import styled from 'styled-components';

interface AutonomicDevelopmentProps {
  task: string;
  energyType?: EnergyType;
  children: React.ReactNode;
  onStateChange?: (state: AutonomicState) => void;
}

interface AutonomicState {
  inFlow: boolean;
  energyLevel: number;
  hasActivePattern: boolean;
  learningCount: number;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  background: #1e1e1e;
  border-radius: 8px;
  color: #ffffff;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  color: #ffffff;
`;

const Stats = styled.div`
  display: flex;
  gap: 16px;
  font-size: 0.9rem;
  color: #a0a0a0;
`;

export const AutonomicDevelopment: React.FC<AutonomicDevelopmentProps> = ({
  task,
  energyType = EnergyType.Mental,
  children,
  onStateChange
}) => {
  const { energy, updateEnergy, setFlowState } = useEnergy(energyType);
  const [learningCount, setLearningCount] = useState(0);
  const [hasActivePattern, setHasActivePattern] = useState(false);

  const handlePatternActivation = useCallback((active: boolean) => {
    setHasActivePattern(active);
    if (active) {
      updateEnergy(10, 'pattern_activation', 'Pattern recognized and activated');
    }
  }, [updateEnergy]);

  const handleEnergyChange = useCallback((level: number, inFlow: boolean) => {
    if (inFlow) {
      setLearningCount(prev => prev + 1);
    }
  }, []);

  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        inFlow: energy.flow === 'flow',
        energyLevel: energy.current,
        hasActivePattern,
        learningCount
      });
    }
  }, [energy.flow, energy.current, hasActivePattern, learningCount, onStateChange]);

  return (
    <Container>
      <Header>
        <Title>{task}</Title>
        <Stats>
          <span>Energy: {Math.round(energy.current)}%</span>
          <span>Flow: {energy.flow}</span>
          <span>Patterns: {learningCount}</span>
        </Stats>
      </Header>
      
      <PatternGuided onPatternChange={handlePatternActivation}>
        <EnergyAware
          energy={energy}
          onEnergyChange={handleEnergyChange}
        >
          {children}
        </EnergyAware>
      </PatternGuided>
    </Container>
  );
}; 