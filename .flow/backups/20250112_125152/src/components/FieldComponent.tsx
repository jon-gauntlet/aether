import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Field } from '@/core/types/system';

interface FieldComponentProps {
  field: Field;
  isActive: boolean;
  isResonating: boolean;
}

const FieldContainer = styled.div<{ isActive: boolean }>`
  padding: ${({ theme }) => theme.space.lg};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  background: ${({ theme, isActive }) =>
    isActive
      ? `linear-gradient(135deg, ${theme.colors.primary}15, ${theme.colors.secondary}15)`
      : theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  transition: all ${({ theme }) => theme.transitions.normal};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      45deg,
      ${({ theme }) => theme.colors.primary}10,
      ${({ theme }) => theme.colors.secondary}10
    );
    opacity: ${({ isActive }) => (isActive ? 1 : 0)};
    transition: opacity ${({ theme }) => theme.transitions.normal};
    animation: ${({ isActive }) => isActive ? 'pulse 4s ease-in-out infinite' : 'none'};
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 0.7; }
    50% { transform: scale(1.02); opacity: 1; }
  }
`;

const FieldCanvas = styled.canvas`
  width: 100%;
  height: 180px;
  margin: ${({ theme }) => theme.space.md} 0;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme }) => theme.colors.background}40;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: ${({ theme }) => theme.space.md};
  margin-top: ${({ theme }) => theme.space.lg};
`;

const Metric = styled.div<{ value: number }>`
  padding: ${({ theme }) => theme.space.md};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme }) => theme.colors.background}40;
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: ${({ value }) => value}%;
    height: 2px;
    background: linear-gradient(
      to right,
      ${({ theme }) => theme.colors.primary},
      ${({ theme }) => theme.colors.secondary}
    );
    transition: width ${({ theme }) => theme.transitions.normal};
  }
`;

const Title = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  margin-bottom: ${({ theme }) => theme.space.md};
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.primary},
    ${({ theme }) => theme.colors.secondary}
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Status = styled.div<{ isActive: boolean; isResonating: boolean }>`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 600;
  text-align: center;
  margin-bottom: ${({ theme }) => theme.space.md};
  color: ${({ theme, isActive, isResonating }) => {
    if (isResonating) return theme.colors.secondary;
    return isActive ? theme.colors.primary : theme.colors.textAlt;
  }};
`;

export const FieldComponent = ({
  field,
  isActive,
  isResonating,
}: FieldComponentProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawField = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      // Draw field
      const centerX = width / 2;
      const centerY = height / 2;
      const maxRadius = Math.min(width, height) / 3;
      
      // Draw resonance waves
      for (let i = 0; i < 3; i++) {
        const radius = maxRadius * (0.6 + i * 0.2);
        const alpha = (1 - i * 0.3) * (isActive ? 1 : 0.5);
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${isResonating ? '139, 92, 246' : '99, 102, 241'}, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw field particles
      for (let i = 0; i < 30; i++) {
        const angle = (i / 30) * Math.PI * 2 + Date.now() * 0.001;
        const radius = maxRadius * (0.8 + Math.sin(Date.now() * 0.002 + i) * 0.2);
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = isResonating ? '#8B5CF640' : '#6366F140';
        ctx.fill();
      }
    };

    const animate = () => {
      drawField();
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animate as unknown as number);
    };
  }, [field, isActive, isResonating]);

  return (
    <FieldContainer isActive={isActive}>
      <Title>Field State</Title>
      <Status isActive={isActive} isResonating={isResonating}>
        Field State: {isActive ? (isResonating ? 'Resonating' : 'Active') : 'Building Strength'}
      </Status>
      <FieldCanvas ref={canvasRef} />
      <MetricsGrid>
        <Metric value={field.resonance.primary.frequency * 100}>
          Frequency: {(field.resonance.primary.frequency * 100).toFixed(0)}%
        </Metric>
        <Metric value={field.resonance.primary.amplitude * 100}>
          Amplitude: {(field.resonance.primary.amplitude * 100).toFixed(0)}%
        </Metric>
        <Metric value={field.resonance.primary.phase * 100}>
          Phase: {(field.resonance.primary.phase * 100).toFixed(0)}%
        </Metric>
        <Metric value={field.protection.strength * 100}>
          Protection: {(field.protection.strength * 100).toFixed(0)}%
        </Metric>
      </MetricsGrid>
    </FieldContainer>
  );
}; 