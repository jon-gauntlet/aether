import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { IField } from '../core/types/base';
import { ConsciousnessState } from '../core/types/consciousness/consciousness';
import { useConsciousness } from '../core/consciousness/useConsciousness';
import { 
  StyledContainerProps, 
  StyledButtonProps, 
  StyledStatusProps,
  CoherentProps,
  StyledProps 
} from './shared/types';

interface IConsciousnessComponentProps {
  consciousness: ConsciousnessState;
  fields: IField[];
  isCoherent: boolean;
}

const ConsciousnessContainer = styled.div<CoherentProps>`
  padding: 30px;
  border-radius: 15px;
  background: ${({ isCoherent }) =>
    isCoherent
      ? 'linear-gradient(135deg, rgba(168, 237, 234, 0.95) 0%, rgba(254, 214, 227, 0.95) 100%)'
      : 'linear-gradient(135deg, rgba(230, 233, 240, 0.95) 0%, rgba(238, 241, 245, 0.95) 100%)'};
  color: ${({ isCoherent }) => (isCoherent ? '#2a2a2a' : '#666')};
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
  transform: scale(${({ isCoherent }) => isCoherent ? 1.02 : 1});

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at center, transparent 0%, rgba(255, 255, 255, 0.1) 100%);
    opacity: ${({ isCoherent }) => (isCoherent ? 1 : 0)};
    transition: opacity 0.5s ease;
    animation: ${({ isCoherent }) => isCoherent ? 'breathe 4s ease-in-out infinite' : 'none'};
  }

  @keyframes breathe {
    0%, 100% { transform: scale(1); opacity: 0.7; }
    50% { transform: scale(1.03); opacity: 1; }
  }
`;

const EnergyField = styled.div<CoherentProps>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  background: radial-gradient(circle at center, 
    rgba(168, 237, 234, 0.2) 0%,
    rgba(254, 214, 227, 0.2) 50%,
    transparent 100%
  );
  opacity: ${({ isCoherent }) => isCoherent ? 0.8 : 0};
  transform-origin: center;
  animation: ${({ isCoherent }) => isCoherent ? 'energyPulse 3s ease-in-out infinite' : 'none'};

  @keyframes energyPulse {
    0%, 100% { transform: scale(1); filter: hue-rotate(0deg); }
    50% { transform: scale(1.1); filter: hue-rotate(30deg); }
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

const Metric = styled.div<StyledProps<'energyLevel'>>`
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

const Status = styled.div<CoherentProps>`
  font-size: 1.4em;
  font-weight: 600;
  text-align: center;
  margin-bottom: 20px;
  color: ${({ isCoherent }) => (isCoherent ? '#2a2a2a' : '#666')};
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
`;

const ConsciousnessCanvas = styled.canvas`
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
      ? action === 'expand'
        ? 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
        : 'linear-gradient(135deg, #fed6e3 0%, #a8edea 100%)'
      : 'rgba(255, 255, 255, 0.2)'};
  color: ${({ isActive }) => (isActive ? '#2a2a2a' : '#999')};
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

export const ConsciousnessComponent = ({
  consciousness,
  fields,
  isCoherent
}: IConsciousnessComponentProps) => {
  const { expandConsciousness, contractConsciousness } = useConsciousness(fields);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawConsciousness = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      // Draw consciousness field
      const centerX = width / 2;
      const centerY = height / 2;
      const maxRadius = Math.min(width, height) / 3;
      const intensity = consciousness.flow.intensity;
      const coherence = consciousness.resonance.coherence;
      const depth = consciousness.depth;

      // Draw expanding circles
      for (let i = 0; i < 5; i++) {
        const radius = maxRadius * (0.4 + i * 0.15) * intensity;
        const alpha = (1 - i * 0.2) * coherence;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${isCoherent ? '168, 237, 234' : '230, 233, 240'}, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw consciousness particles
      for (let i = 0; i < 50; i++) {
        const angle = (i / 50) * Math.PI * 2;
        const radius = maxRadius * (0.8 + Math.sin(Date.now() * 0.001 + i) * 0.2) * depth;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = isCoherent ? '#fed6e3' : '#eef1f5';
        ctx.fill();
      }
    };

    const animate = () => {
      drawConsciousness();
      requestAnimationFrame(animate);
    };

    animate();
  }, [consciousness, isCoherent]);

  return (
    <ConsciousnessContainer isCoherent={isCoherent}>
      <Status isCoherent={isCoherent}>
        Consciousness State: {isCoherent ? 'Coherent' : 'Building Coherence'}
      </Status>
      
      <ConsciousnessCanvas ref={canvasRef} />
      
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

      <ButtonContainer>
        <ActionButton 
          onClick={expandConsciousness} 
          disabled={isCoherent}
          isActive={!isCoherent}
          action="expand"
        >
          Expand Consciousness
        </ActionButton>
        <ActionButton 
          onClick={contractConsciousness} 
          disabled={!isCoherent}
          isActive={isCoherent}
          action="contract"
        >
          Contract Consciousness
        </ActionButton>
      </ButtonContainer>
    </ConsciousnessContainer>
  );
}; 