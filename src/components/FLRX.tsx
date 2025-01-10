import React from 'react';
import styled from 'styled-components';
import { Field } from '../core/types/base';
import { useField } from '../core/fields/useField';

interface FieldComponentProps {
  initialField: Field;
}

const FieldContainer = styled.div<{ isActive: boolean }>`
  padding: 20px;
  border-radius: 10px;
  background: ${props => props.isActive ? 
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 
    'linear-gradient(135deg, #e6e9f0 0%, #eef1f5 100%)'};
  color: ${props => props.isActive ? '#fff' : '#333'};
  transition: all 0.3s ease;
`;

const FieldMetrics = styled.div`
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
    background: ${props => props.value > 0.7 ? '#667eea' : '#e6e9f0'};
    transition: width 0.3s ease;
  }
`;

const FieldStatus = styled.div<{ isActive: boolean }>`
  font-size: 1.2em;
  font-weight: bold;
  text-align: center;
  margin-bottom: 15px;
  color: ${props => props.isActive ? '#fff' : '#666'};
`;

const ResonanceDisplay = styled.div<{ amplitude: number }>`
  height: 60px;
  margin: 15px 0;
  position: relative;
  overflow: hidden;
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.1);

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    width: 100%;
    height: 2px;
    background: rgba(255, 255, 255, 0.5);
    animation: wave ${props => 2 / props.amplitude}s ease-in-out infinite;
    transform-origin: center;
  }

  @keyframes wave {
    0%, 100% { transform: translateY(0) scaleY(1); }
    50% { transform: translateY(0) scaleY(${props => props.amplitude * 2}); }
  }
`;

export const FieldComponent: React.FC<FieldComponentProps> = ({ initialField }) => {
  const { fieldState, amplifyField, dampField } = useField(initialField);
  const { field, isActive, isResonating, isProtected } = fieldState;

  return (
    <FieldContainer isActive={isActive}>
      <FieldStatus isActive={isActive}>
        {field.name} - {isActive ? 'Active' : 'Inactive'}
      </FieldStatus>
      
      <ResonanceDisplay amplitude={field.resonance.amplitude} />
      
      <FieldMetrics>
        <Metric value={field.strength}>
          Strength: {(field.strength * 100).toFixed(0)}%
        </Metric>
        <Metric value={field.resonance.amplitude}>
          Resonance: {(field.resonance.amplitude * 100).toFixed(0)}%
        </Metric>
        <Metric value={field.protection.shields}>
          Shields: {(field.protection.shields * 100).toFixed(0)}%
        </Metric>
        <Metric value={field.protection.resilience}>
          Resilience: {(field.protection.resilience * 100).toFixed(0)}%
        </Metric>
      </FieldMetrics>

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button onClick={amplifyField} disabled={isResonating}>
          Amplify Field
        </button>
        <button onClick={dampField} disabled={!isActive}>
          Damp Field
        </button>
      </div>
    </FieldContainer>
  );
}; 