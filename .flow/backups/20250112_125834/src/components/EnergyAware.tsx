import React from 'react';
import styled from 'styled-components';
import { Energy } from '@/core/types/system';

interface EnergyAwareProps {
  energy: Energy;
  isActive?: boolean;
}

const EnergyContainer = styled.div<{ isActive?: boolean }>`
  padding: ${({ theme }) => theme.space.lg};
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.lg};
  opacity: ${({ isActive }) => (isActive ? 1 : 0.7)};
  transition: opacity 0.3s ease;
`;

const EnergyLevel = styled.div<{ level: number }>`
  width: ${({ level }) => level * 100}%;
  height: 4px;
  background: ${({ theme }) => theme.colors.primary};
  border-radius: 2px;
  transition: width 0.3s ease;
`;

const EnergyMetric = styled.div`
  margin: ${({ theme }) => theme.space.sm} 0;
`;

export const EnergyAware: React.FC<EnergyAwareProps> = ({
  energy,
  isActive = true
}) => {
  return (
    <EnergyContainer isActive={isActive}>
      <h3>Energy Field</h3>
      
      <EnergyMetric>
        <div>Level: {energy.level}</div>
        <EnergyLevel level={energy.level} />
      </EnergyMetric>

      <EnergyMetric>
        <div>Frequency: {energy.frequency}</div>
        <EnergyLevel level={energy.frequency} />
      </EnergyMetric>

      <EnergyMetric>
        <div>Coherence: {energy.coherence}</div>
        <EnergyLevel level={energy.coherence} />
      </EnergyMetric>
    </EnergyContainer>
  );
}; 