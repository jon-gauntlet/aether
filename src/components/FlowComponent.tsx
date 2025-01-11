import React from 'react';
import styled from 'styled-components';
import { IField } from '../core/types/base';
import { useFlow } from '../core/flow/useFlow';

interface IFlowComponentProps {
  fields: IField[];
  isInFlow: boolean;
  value: number;
}

const FlowContainer = styled.div<{ isInFlow: boolean }>`
  padding: 20px;
  border-radius: 10px;
  background: ${(props: { isInFlow: boolean }) =>
    props.isInFlow
      ? 'linear-gradient(135deg, #00f260 0%, #0575e6 100%)'
      : 'linear-gradient(135deg, #e6e9f0 0%, #eef1f5 100%)'};
  color: ${(props: { isInFlow: boolean }) => (props.isInFlow ? '#fff' : '#333')};
  transition: all 0.3s ease;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 15px;
`;

const Metric = styled.div<{ value: number }>`
  padding: 10px;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.3);
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: ${(props: { value: number }) => props.value * 100}%;
    height: 3px;
    background: ${(props: { value: number }) => (props.value > 0.7 ? '#00f260' : '#e6e9f0')};
    transition: width 0.3s ease;
  }
`;

const Status = styled.div<{ isInFlow: boolean }>`
  font-size: 1.2em;
  font-weight: bold;
  text-align: center;
  margin-bottom: 15px;
  color: ${(props: { isInFlow: boolean }) => (props.isInFlow ? '#fff' : '#666')};
`;

export const FlowComponent = ({ fields, isInFlow, value }: IFlowComponentProps) => {
  const { flow, transition } = useFlow();

  const enterFlow = async () => {
    try {
      await transition('flow', 'user_initiated');
    } catch (error) {
      console.error('Failed to enter flow state:', error);
    }
  };

  const exitFlow = async () => {
    try {
      await transition('natural', 'user_initiated');
    } catch (error) {
      console.error('Failed to exit flow state:', error);
    }
  };

  return (
    <FlowContainer isInFlow={isInFlow}>
      <Status isInFlow={isInFlow}>
        {isInFlow ? 'In Flow State' : 'Building Flow'}
      </Status>
      
      <MetricsGrid>
        <Metric value={flow.metrics.focus}>
          Focus: {(flow.metrics.focus * 100).toFixed(0)}%
        </Metric>
        <Metric value={flow.metrics.presence}>
          Presence: {(flow.metrics.presence * 100).toFixed(0)}%
        </Metric>
        <Metric value={flow.metrics.coherence}>
          Coherence: {(flow.metrics.coherence * 100).toFixed(0)}%
        </Metric>
        <Metric value={flow.metrics.sustainability}>
          Sustainability: {(flow.metrics.sustainability * 100).toFixed(0)}%
        </Metric>
      </MetricsGrid>

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={enterFlow} disabled={isInFlow}>
          Enter Flow
        </button>
        <button onClick={exitFlow} disabled={!isInFlow}>
          Exit Flow
        </button>
      </div>
    </FlowContainer>
  );
}; 