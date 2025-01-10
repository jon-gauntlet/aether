import React from 'react';
import styled from 'styled-components';
import { Field } from '../core/types/base';
import { useConsciousness } from '../core/consciousness/useConsciousness';

interface ConsciousnessComponentProps {
  fields: Field[];
}

const ConsciousnessContainer = styled.div<{ isCoherent: boolean }>`
  padding: 20px;
  border-radius: 10px;
  background: ${props => props.isCoherent ? 
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' : 
    'linear-gradient(135deg, #e6e9f0 0%, #eef1f5 100%)'};
  color: ${props => props.isCoherent ? '#333' : '#666'};
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
    width: ${props => props.value * 100}%;
    height: 3px;
    background: ${props => props.value > 0.7 ? '#a8edea' : '#e6e9f0'};
    transition: width 0.3s ease;
  }
`;

const Status = styled.div<{ isCoherent: boolean }>`
  font-size: 1.2em;
  font-weight: bold;
  text-align: center;
  margin-bottom: 15px;
  color: ${props => props.isCoherent ? '#333' : '#666'};
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
    height: ${props => props.utilization * 100}%;
    background: linear-gradient(180deg, #a8edea 0%, #fed6e3 100%);
    transition: height 0.3s ease;
  }
`;

export const ConsciousnessComponent: React.FC<ConsciousnessComponentProps> = ({ fields }) => {
  const { consciousnessState, expandConsciousness, contractConsciousness } = useConsciousness(fields);
  const { consciousness, isCoherent, isIntegrated, isFlexible } = consciousnessState;

  return (
    <ConsciousnessContainer isCoherent={isCoherent}>
      <Status isCoherent={isCoherent}>
        Consciousness State: {isCoherent ? 'Coherent' : 'Building Coherence'}
      </Status>
      
      <FlowSpace utilization={consciousness.flowSpace.utilization} />
      
      <MetricsGrid>
        <Metric value={consciousness.metrics.clarity}>
          Clarity: {(consciousness.metrics.clarity * 100).toFixed(0)}%
        </Metric>
        <Metric value={consciousness.metrics.depth}>
          Depth: {(consciousness.metrics.depth * 100).toFixed(0)}%
        </Metric>
        <Metric value={consciousness.metrics.coherence}>
          Coherence: {(consciousness.metrics.coherence * 100).toFixed(0)}%
        </Metric>
        <Metric value={consciousness.metrics.integration}>
          Integration: {(consciousness.metrics.integration * 100).toFixed(0)}%
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