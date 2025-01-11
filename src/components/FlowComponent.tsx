import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { IField } from '../core/types/base';
import { useFlow } from '../core/flow/useFlow';
import { 
  StyledContainerProps, 
  StyledButtonProps, 
  StyledStatusProps,
  FlowProps,
  StyledProps 
} from './shared/types';

interface IFlowComponentProps {
  fields: IField[];
  isInFlow: boolean;
  value: number;
}

const FlowContainer = styled.div<FlowProps>`
  padding: 30px;
  border-radius: 15px;
  background: ${({ isInFlow }) =>
    isInFlow
      ? 'linear-gradient(135deg, rgba(0, 242, 96, 0.95) 0%, rgba(5, 117, 230, 0.95) 100%)'
      : 'linear-gradient(135deg, rgba(230, 233, 240, 0.95) 0%, rgba(238, 241, 245, 0.95) 100%)'};
  color: ${({ isInFlow }) => (isInFlow ? '#fff' : '#333')};
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
  transform: scale(${({ isInFlow }) => isInFlow ? 1.02 : 1});

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at center, transparent 0%, rgba(255, 255, 255, 0.1) 100%);
    opacity: ${({ isInFlow }) => (isInFlow ? 1 : 0)};
    transition: opacity 0.5s ease;
    animation: ${({ isInFlow }) => isInFlow ? 'flowPulse 3s ease-in-out infinite' : 'none'};
  }

  @keyframes flowPulse {
    0%, 100% { transform: scale(1); filter: hue-rotate(0deg); }
    50% { transform: scale(1.05); filter: hue-rotate(15deg); }
  }
`;

const FlowField = styled.div<FlowProps>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  background: radial-gradient(circle at center, 
    rgba(0, 242, 96, 0.2) 0%,
    rgba(5, 117, 230, 0.2) 50%,
    transparent 100%
  );
  opacity: ${({ isInFlow }) => isInFlow ? 0.8 : 0};
  transform-origin: center;
  animation: ${({ isInFlow }) => isInFlow ? 'flowEnergy 4s ease-in-out infinite' : 'none'};

  @keyframes flowEnergy {
    0%, 100% { transform: scale(1) rotate(0deg); }
    50% { transform: scale(1.1) rotate(5deg); }
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
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: translateY(-2px);
  }

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

const Status = styled.div<FlowProps>`
  font-size: 1.4em;
  font-weight: 600;
  text-align: center;
  margin-bottom: 20px;
  color: ${({ isInFlow }) => (isInFlow ? '#fff' : '#666')};
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
`;

const FlowCanvas = styled.canvas`
  width: 100%;
  height: 120px;
  margin: 20px 0;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(5px);
`;

const ActionButton = styled.button<StyledButtonProps>`
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: ${({ isActive, action }) =>
    isActive
      ? action === 'enter'
        ? 'linear-gradient(135deg, #00f260 0%, #0575e6 100%)'
        : 'linear-gradient(135deg, #0575e6 0%, #00f260 100%)'
      : 'rgba(255, 255, 255, 0.2)'};
  color: ${({ isActive }) => (isActive ? '#fff' : '#999')};
  font-size: 1.1em;
  font-weight: 500;
  cursor: ${({ isActive }) => (isActive ? 'pointer' : 'not-allowed')};
  transition: all 0.3s ease;

  &:not(:disabled):hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &:not(:disabled):active {
    transform: translateY(0);
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 20px;
`;

export const FlowComponent = ({ fields, isInFlow, value }: IFlowComponentProps) => {
  const { flow, transition } = useFlow();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawFlow = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      // Flow field parameters
      const cellSize = 20;
      const cols = Math.floor(width / cellSize);
      const rows = Math.floor(height / cellSize);
      const numParticles = 50;
      
      // Draw flow field
      ctx.strokeStyle = isInFlow ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)';
      ctx.lineWidth = 1;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * cellSize;
          const y = j * cellSize;
          const angle = (Math.sin(x * 0.05) + Math.cos(y * 0.05)) * Math.PI * 2;
          
          ctx.beginPath();
          ctx.moveTo(x + cellSize / 2, y + cellSize / 2);
          ctx.lineTo(
            x + cellSize / 2 + Math.cos(angle) * cellSize * 0.4,
            y + cellSize / 2 + Math.sin(angle) * cellSize * 0.4
          );
          ctx.stroke();
        }
      }

      // Draw particles
      ctx.fillStyle = isInFlow ? '#fff' : '#0575e6';
      
      for (let i = 0; i < numParticles; i++) {
        const x = (width * (i % cols)) / cols + Math.sin(Date.now() * 0.001 + i) * 10;
        const y = (height * Math.floor(i / cols)) / rows + Math.cos(Date.now() * 0.001 + i) * 10;
        const size = 2 + Math.sin(Date.now() * 0.002 + i) * 1;

        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const animate = () => {
      drawFlow();
      requestAnimationFrame(animate);
    };

    animate();
  }, [isInFlow]);

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
      
      <FlowCanvas ref={canvasRef} />
      
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

      <ButtonContainer>
        <ActionButton 
          onClick={enterFlow} 
          disabled={isInFlow}
          isActive={!isInFlow}
          action="enter"
        >
          Enter Flow State
        </ActionButton>
        <ActionButton 
          onClick={exitFlow} 
          disabled={!isInFlow}
          isActive={isInFlow}
          action="exit"
        >
          Exit Flow State
        </ActionButton>
      </ButtonContainer>
    </FlowContainer>
  );
}; 