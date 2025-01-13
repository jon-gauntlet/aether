import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Field } from '@/core/types/system';

interface FlowComponentProps {
  fields: Field[];
  isInFlow: boolean;
  value: number;
}

const FlowContainer = styled.div<{ isInFlow: boolean }>`
  padding: ${({ theme }) => theme.space.xl};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  background: ${({ theme, isInFlow }) =>
    isInFlow
      ? `linear-gradient(135deg, ${theme.colors.primary}20, ${theme.colors.secondary}20)`
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
    opacity: ${({ isInFlow }) => (isInFlow ? 1 : 0)};
    transition: opacity ${({ theme }) => theme.transitions.normal};
  }
`;

const FlowCanvas = styled.canvas`
  width: 100%;
  height: 200px;
  margin: ${({ theme }) => theme.space.md} 0;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ theme }) => theme.colors.background}40;
`;

const FlowMetrics = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
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

export const FlowComponent = ({ fields, isInFlow, value }: FlowComponentProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawFlow = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      // Draw flow particles
      fields.forEach((field) => {
        const numParticles = Math.floor(field.strength * 50);
        for (let i = 0; i < numParticles; i++) {
          const x = Math.random() * width;
          const y = Math.random() * height;
          const size = Math.random() * 3 + 1;

          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fillStyle = isInFlow ? '#6366F140' : '#94A3B840';
          ctx.fill();
        }
      });

      // Draw flow lines
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      for (let x = 0; x < width; x++) {
        const y =
          height / 2 +
          Math.sin(x * 0.02 + Date.now() * 0.001) * 30 * (isInFlow ? 1 : 0.3);
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = isInFlow ? '#6366F140' : '#94A3B840';
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    const animate = () => {
      drawFlow();
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      // Cleanup animation frame on unmount
      cancelAnimationFrame(animate as unknown as number);
    };
  }, [fields, isInFlow]);

  return (
    <FlowContainer isInFlow={isInFlow}>
      <Title>Flow State</Title>
      <FlowCanvas ref={canvasRef} />
      <FlowMetrics>
        <Metric value={value}>
          Flow Intensity: {value}%
        </Metric>
        {fields.map((field, index) => (
          <Metric key={index} value={field.strength * 100}>
            Field {index + 1}: {(field.strength * 100).toFixed(0)}%
          </Metric>
        ))}
      </FlowMetrics>
    </FlowContainer>
  );
}; 