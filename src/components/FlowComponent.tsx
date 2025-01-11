import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { IField } from '../core/types/base';
import { useFlow } from '../core/flow/useFlow';

interface IFlowComponentProps {
  fields: IField[];
  isInFlow: boolean;
  value: number;
}

const FlowContainer = styled.div<{ isInFlow: boolean }>`
  padding: 30px;
  border-radius: 15px;
  background: ${(props) =>
    props.isInFlow
      ? 'linear-gradient(135deg, rgba(0, 242, 96, 0.95) 0%, rgba(5, 117, 230, 0.95) 100%)'
      : 'linear-gradient(135deg, rgba(230, 233, 240, 0.95) 0%, rgba(238, 241, 245, 0.95) 100%)'};
  color: ${(props) => (props.isInFlow ? '#fff' : '#333')};
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at center, transparent 0%, rgba(255, 255, 255, 0.1) 100%);
    opacity: ${(props) => (props.isInFlow ? 1 : 0)};
    transition: opacity 0.5s ease;
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-top: 20px;
`;

const Metric = styled.div<{ value: number }>`
  padding: 15px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.15);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(5px);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: ${(props) => props.value * 100}%;
    height: 3px;
    background: ${(props) =>
      props.value > 0.7
        ? 'linear-gradient(90deg, #00f260, #0575e6)'
        : 'linear-gradient(90deg, #e6e9f0, #eef1f5)'};
    transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }
`;

const Status = styled.div<{ isInFlow: boolean }>`
  font-size: 1.4em;
  font-weight: 600;
  text-align: center;
  margin-bottom: 20px;
  color: ${(props) => (props.isInFlow ? '#fff' : '#666')};
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

const ActionButton = styled.button<{ isActive: boolean; action: 'enter' | 'exit' }>`
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: ${(props) =>
    props.isActive
      ? props.action === 'enter'
        ? 'linear-gradient(135deg, #00f260 0%, #0575e6 100%)'
        : 'linear-gradient(135deg, #0575e6 0%, #00f260 100%)'
      : 'rgba(255, 255, 255, 0.2)'};
  color: ${(props) => (props.isActive ? '#fff' : '#999')};
  font-size: 1.1em;
  font-weight: 500;
  cursor: ${(props) => (props.isActive ? 'pointer' : 'not-allowed')};
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