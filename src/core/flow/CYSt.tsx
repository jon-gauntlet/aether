import React from 'react';
import styled from 'styled-components';
import { Field } from '../core/types/base';
import { ConsciousnessState } from '../core/types/consciousness';
import { useFlow } from '../core/flow/useFlow';

interface FlowComponentProps {
  field: Field;
  consciousness: ConsciousnessState;
}

const FlowContainer = styled.div<{ isInFlow: boolean }>`
  padding: 20px;
  border-radius: 10px;
  background: ${props => props.isInFlow ? 
    'linear-gradient(135deg, #00f260 0%, #0575e6 100%)' : 
    'linear-gradient(135deg, #e6e9f0 0%, #eef1f5 100%)'};
  color: ${props => props.isInFlow ? '#fff' : '#333'};
  transition: all 0.3s ease;
`;

const FlowMetrics = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 15px;
`;

const Metric = styled.div<{ value: number }>`
  padding: 10px;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: ${props => props.value * 100}%;
    height: 3px;
    background: ${props => props.value > 0.7 ? '#00f260' : '#e6e9f0'};
    transition: width 0.3s ease;
  }
`;

const FlowStatus = styled.div<{ isInFlow: boolean }>`
  font-size: 1.2em;
  font-weight: bold;
  text-align: center;
  margin-bottom: 15px;
  color: ${props => props.isInFlow ? '#fff' : '#666'};
`;

export const FlowComponent: React.FC<FlowComponentProps> = ({ field, consciousness }) => {
  const { flowState, enhanceFlow, disruptFlow } = useFlow(field, consciousness);
  const { flowMetrics, isInFlow } = flowState;

  return (
    <FlowContainer isInFlow={isInFlow}>
      <FlowStatus isInFlow={isInFlow}>
        {isInFlow ? 'In Flow State' : 'Building Flow'}
      </FlowStatus>
      
      <FlowMetrics>
        <Metric value={flowMetrics.velocity}>
          Velocity: {(flowMetrics.velocity * 100).toFixed(0)}%
        </Metric>
        <Metric value={flowMetrics.momentum}>
          Momentum: {(flowMetrics.momentum * 100).toFixed(0)}%
        </Metric>
        <Metric value={1 - flowMetrics.resistance}>
          Flow: {((1 - flowMetrics.resistance) * 100).toFixed(0)}%
        </Metric>
        <Metric value={flowMetrics.conductivity}>
          Conductivity: {(flowMetrics.conductivity * 100).toFixed(0)}%
        </Metric>
      </FlowMetrics>

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={enhanceFlow} disabled={isInFlow}>
          Enhance Flow
        </button>
        <button onClick={disruptFlow} disabled={!isInFlow}>
          Take Break
        </button>
      </div>
    </FlowContainer>
  );
}; 