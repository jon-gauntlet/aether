import React from 'react';
import styled from 'styled-components';
import { IField } from '../core/types/base';
import { useField } from '../core/fields/useField';

interface IFieldComponentProps {
  field: IField;
  isActive: boolean;
  value: number;
}

const FieldContainer = styled.div<{ isActive: boolean }>`
  padding: 20px;
  border-radius: 10px;
  background: ${(props: { isActive: boolean }) =>
    props.isActive
      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      : 'linear-gradient(135deg, #e6e9f0 0%, #eef1f5 100%)'};
  color: ${(props: { isActive: boolean }) => (props.isActive ? '#fff' : '#333')};
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
    background: ${(props: { value: number }) => (props.value > 0.7 ? '#667eea' : '#e6e9f0')};
    transition: width 0.3s ease;
  }
`;

const Status = styled.div<{ isActive: boolean }>`
  font-size: 1.2em;
  font-weight: bold;
  text-align: center;
  margin-bottom: 15px;
  color: ${(props: { isActive: boolean }) => (props.isActive ? '#fff' : '#666')};
`;

const Wave = styled.div<{ amplitude: number }>`
  height: 60px;
  margin: 15px 0;
  position: relative;
  overflow: hidden;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.3);

  @keyframes wave {
    0% {
      transform: translateY(0) scaleY(1);
    }
    100% {
      transform: translateY(0) scaleY(${(props: { amplitude: number }) => props.amplitude * 2});
    }
  }
`;

export const FieldComponent = ({ field, isActive, value }: IFieldComponentProps) => {
  const { fieldState, amplifyField } = useField(field);
  const { isResonating } = fieldState;

  return (
    <FieldContainer isActive={isActive}>
      <Status isActive={isActive}>
        Field State: {isActive ? 'Active' : 'Building Strength'}
      </Status>
      
      <Wave amplitude={field.resonance.amplitude} />
      
      <MetricsGrid>
        <Metric value={field.strength}>
          Strength: {(field.strength * 100).toFixed(0)}%
        </Metric>
        <Metric value={field.coherence}>
          Coherence: {(field.coherence * 100).toFixed(0)}%
        </Metric>
        <Metric value={field.stability}>
          Stability: {(field.stability * 100).toFixed(0)}%
        </Metric>
        <Metric value={field.protection.shields}>
          Protection: {(field.protection.shields * 100).toFixed(0)}%
        </Metric>
      </MetricsGrid>

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={amplifyField} disabled={isActive}>
          Amplify
        </button>
      </div>
    </FieldContainer>
  );
}; 