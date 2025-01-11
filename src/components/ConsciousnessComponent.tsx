import React from 'react';
import styled from 'styled-components';
import { IField } from '../core/types/base';
import { ConsciousnessState } from '../core/types/consciousness/consciousness';
import { useConsciousness } from '../core/consciousness/useConsciousness';

interface IConsciousnessComponentProps {
  consciousness: ConsciousnessState;
  fields: IField[];
  isCoherent: boolean;
}

const ConsciousnessContainer = styled.div<{ isCoherent: boolean }>`
  padding: 20px;
  border-radius: 10px;
  background: ${(props: { isCoherent: boolean }) =>
    props.isCoherent
      ? 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
      : 'linear-gradient(135deg, #e6e9f0 0%, #eef1f5 100%)'};
  color: ${(props: { isCoherent: boolean }) => (props.isCoherent ? '#333' : '#666')};
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
    background: ${(props: { value: number }) => (props.value > 0.7 ? '#a8edea' : '#e6e9f0')};
    transition: width 0.3s ease;
  }
`;

const Status = styled.div<{ isCoherent: boolean }>`
  font-size: 1.2em;
  font-weight: bold;
  text-align: center;
  margin-bottom: 15px;
  color: ${(props: { isCoherent: boolean }) => (props.isCoherent ? '#333' : '#666')};
`;

const FlowSpace = styled.div<{ utilization: number }>`
  height: 60px;
  margin: 15px 0;
  position: relative;
  overflow: hidden;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.3);

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: ${(props: { utilization: number }) => props.utilization * 100}%;
    background: linear-gradient(180deg, #a8edea 0%, #fed6e3 100%);
    transition: height 0.3s ease;
  }
`;

export const ConsciousnessComponent = ({
  consciousness,
  fields,
  isCoherent
}: IConsciousnessComponentProps) => {
  const { expandConsciousness, contractConsciousness } = useConsciousness(fields);

  return (
    <ConsciousnessContainer isCoherent={isCoherent}>
      <Status isCoherent={isCoherent}>
        Consciousness State: {isCoherent ? 'Coherent' : 'Building Coherence'}
      </Status>
      
      <FlowSpace utilization={consciousness.flow.intensity} />
      
      <MetricsGrid>
        <Metric value={consciousness.resonance.coherence}>
          Clarity: {(consciousness.resonance.coherence * 100).toFixed(0)}%
        </Metric>
        <Metric value={consciousness.depth}>
          Depth: {(consciousness.depth * 100).toFixed(0)}%
        </Metric>
        <Metric value={consciousness.resonance.harmony}>
          Coherence: {(consciousness.resonance.harmony * 100).toFixed(0)}%
        </Metric>
        <Metric value={consciousness.energy.mental}>
          Integration: {(consciousness.energy.mental * 100).toFixed(0)}%
        </Metric>
      </MetricsGrid>

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={expandConsciousness} disabled={isCoherent}>
          Expand
        </button>
        <button onClick={contractConsciousness} disabled={!isCoherent}>
          Contract
        </button>
      </div>
    </ConsciousnessContainer>
  );
}; 