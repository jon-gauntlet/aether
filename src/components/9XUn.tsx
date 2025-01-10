import React, { useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { Energy, FlowState } from '../core/energy/types';

interface EnergyAwareProps {
  energy: Energy;
  children: React.ReactNode;
  onEnergyChange?: (level: number, inFlow: boolean) => void;
}

const Container = styled.div<{ energyLevel: number }>`
  position: relative;
  padding: 16px;
  background: ${props => `rgba(30, 30, 30, ${1 - props.energyLevel / 100})`};
  border-radius: 8px;
  transition: background 0.3s ease;
`;

const FlowIndicator = styled.div<{ active: boolean }>`
  position: absolute;
  top: 0;
  right: 0;
  width: 8px;
  height: 8px;
  margin: 8px;
  border-radius: 50%;
  background: ${props => props.active ? '#4CAF50' : '#757575'};
  transition: background 0.3s ease;
`;

const Warning = styled.div`
  margin-top: 8px;
  padding: 8px;
  background: #ff5722;
  color: white;
  border-radius: 4px;
  font-size: 0.9rem;
  display: ${props => props.hidden ? 'none' : 'block'};
`;

export const EnergyAware: React.FC<EnergyAwareProps> = ({
  energy,
  children,
  onEnergyChange
}) => {
  const isInFlow = energy.flow === FlowState.Flow;
  const isExhausted = energy.flow === FlowState.Exhausted;

  useEffect(() => {
    if (onEnergyChange) {
      onEnergyChange(energy.current, isInFlow);
    }
  }, [energy.current, isInFlow, onEnergyChange]);

  const handleBreakClick = useCallback(() => {
    // This would be handled by the parent through energy state changes
    console.log('Break suggested');
  }, []);

  return (
    <Container energyLevel={energy.current}>
      <FlowIndicator active={isInFlow} />
      {children}
      {isExhausted && (
        <Warning>
          Energy levels critical. Consider taking a break to recover.
          <button onClick={handleBreakClick}>Take Break</button>
        </Warning>
      )}
    </Container>
  );
}; 