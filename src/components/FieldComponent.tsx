import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { IField } from '../core/types/base';
import { useField } from '../core/fields/useField';
import { 
  StyledContainerProps, 
  StyledButtonProps, 
  StyledStatusProps,
  ActiveProps,
  StyledProps 
} from './shared/types';

interface IFieldComponentProps {
  field: IField;
  isActive: boolean;
  value: number;
}

const FieldContainer = styled.div<ActiveProps>`
  padding: 30px;
  border-radius: 15px;
  background: ${({ isActive }) =>
    isActive
      ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.95) 0%, rgba(118, 75, 162, 0.95) 100%)'
      : 'linear-gradient(135deg, rgba(230, 233, 240, 0.95) 0%, rgba(238, 241, 245, 0.95) 100%)'};
  color: ${({ isActive }) => (isActive ? '#fff' : '#333')};
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
  transform: scale(${({ isActive }) => isActive ? 1.02 : 1});

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at center, transparent 0%, rgba(255, 255, 255, 0.1) 100%);
    opacity: ${({ isActive }) => (isActive ? 1 : 0)};
    transition: opacity 0.5s ease;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-top: 20px;
  opacity: 0;
  transform: translateY(20px);
  animation: fadeIn 0.5s ease-out forwards;

  @keyframes fadeIn {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const Metric = styled.div<StyledProps<'value'>>`
  padding: 15px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.15);
  position: relative;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.1) 0%,
      rgba(255, 255, 255, 0.05) 100%
    );
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  &:hover::after {
    transform: translateX(0);
  }
`;

const Status = styled.div<ActiveProps>`
  font-size: 1.4em;
  font-weight: 600;
  text-align: center;
  margin-bottom: 20px;
  color: ${({ isActive }) => (isActive ? '#fff' : '#666')};
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
`;

const Wave = styled.canvas`
  width: 100%;
  height: 80px;
  margin: 20px 0;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(5px);
`;

const AmplifyButton = styled.button<StyledButtonProps>`
  width: 100%;
  padding: 12px;
  margin-top: 20px;
  border: none;
  border-radius: 8px;
  background: ${({ isActive }) =>
    isActive
      ? 'rgba(255, 255, 255, 0.2)'
      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
  color: ${({ isActive }) => (isActive ? '#999' : '#fff')};
  font-size: 1.1em;
  font-weight: 500;
  cursor: ${({ isActive }) => (isActive ? 'not-allowed' : 'pointer')};
  transition: all 0.3s ease;

  &:not(:disabled):hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  &:not(:disabled):active {
    transform: translateY(0);
  }
`;

export const FieldComponent = ({ field, isActive, value }: IFieldComponentProps) => {
  const { fieldState, amplifyField } = useField(field);
  const { isResonating } = fieldState;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawWave = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      
      ctx.beginPath();
      ctx.moveTo(0, height / 2);

      const frequency = field.resonance.frequency;
      const amplitude = field.resonance.amplitude * height / 3;
      const phase = field.resonance.phase;

      for (let x = 0; x < width; x++) {
        const y = height / 2 + 
          Math.sin((x * frequency * 0.05) + phase) * amplitude * 
          Math.sin(x * 0.02) * 0.5;
        ctx.lineTo(x, y);
      }

      ctx.strokeStyle = isActive ? '#fff' : '#667eea';
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    const animate = () => {
      drawWave();
      field.resonance.phase += 0.05;
      requestAnimationFrame(animate);
    };

    animate();
  }, [field, isActive]);

  return (
    <FieldContainer isActive={isActive}>
      <Status isActive={isActive}>
        Field State: {isActive ? 'Active' : 'Building Strength'}
      </Status>
      
      <Wave ref={canvasRef} />
      
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

      <AmplifyButton onClick={amplifyField} disabled={isActive} isActive={isActive}>
        Amplify Field
      </AmplifyButton>
    </FieldContainer>
  );
}; 