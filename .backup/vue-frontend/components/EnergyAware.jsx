import React from 'react';
import styled from 'styled-components';
import { Energy } from '@/core/types/system';

interface EnergyAwareProps {
  energy: Energy;
  isActive?: boolean;
}

const ;

const EnergyLevel = styled.div<{ level: number }>`
  width: ${({ level }) => level * 100}%;
  height: 4px;
  background: ${({ theme }) => theme.colors.primary};
  border-radius: 2px;
  transition: width 0.3s ease;
`;

const ;

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