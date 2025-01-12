import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { Pattern } from '@/core/types/system';

interface PatternVisualizationProps {
  pattern: Pattern;
  isActive: boolean;
}

const PatternContainer = styled.div<{ isActive: boolean }>`
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
    animation: ${({ isActive }) => isActive ? 'flow 4s ease-in-out infinite' : 'none'};
  }

  @keyframes flow {
    0%, 100% { transform: scale(1); opacity: 0.7; }
    50% { transform: scale(1.02); opacity: 1; }
  }
`;

const PatternCanvas = styled.canvas`
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

const Status = styled.div<{ isActive: boolean }>`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 600;
  text-align: center;
  margin-bottom: ${({ theme }) => theme.space.md};
  color: ${({ theme, isActive }) =>
    isActive ? theme.colors.primary : theme.colors.textAlt};
`;

export const PatternVisualization = ({
  pattern,
  isActive,
}: PatternVisualizationProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawPattern = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      // Draw pattern grid
      const gridSize = 20;
      const cellSize = Math.min(width, height) / gridSize;

      ctx.strokeStyle = `${isActive ? '#6366F120' : '#94A3B820'}`;
      ctx.lineWidth = 1;

      // Draw vertical lines
      for (let x = 0; x <= width; x += cellSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Draw horizontal lines
      for (let y = 0; y <= height; y += cellSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw pattern nodes
      const nodeRadius = 4;
      pattern.nodes.forEach((node, index) => {
        const x = (node.position.x + 1) * width / 2;
        const y = (node.position.y + 1) * height / 2;

        // Draw node
        ctx.beginPath();
        ctx.arc(x, y, nodeRadius, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? '#6366F1' : '#94A3B8';
        ctx.fill();

        // Draw connections
        pattern.connections.forEach(conn => {
          if (conn.source === index || conn.target === index) {
            const targetNode = pattern.nodes[conn.source === index ? conn.target : conn.source];
            const targetX = (targetNode.position.x + 1) * width / 2;
            const targetY = (targetNode.position.y + 1) * height / 2;

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(targetX, targetY);
            ctx.strokeStyle = isActive ? '#6366F140' : '#94A3B840';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        });
      });
    };

    const animate = () => {
      drawPattern();
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animate as unknown as number);
    };
  }, [pattern, isActive]);

  return (
    <PatternContainer isActive={isActive}>
      <Title>Pattern Visualization</Title>
      <Status isActive={isActive}>
        Activations: {pattern.activations}
      </Status>
      <PatternCanvas ref={canvasRef} />
      <MetricsGrid>
        <Metric value={pattern.strength * 100}>
          Strength: {(pattern.strength * 100).toFixed(0)}%
        </Metric>
        <Metric value={pattern.metrics.coherence.current * 100}>
          Coherence: {(pattern.metrics.coherence.current * 100).toFixed(0)}%
        </Metric>
        <Metric value={pattern.metrics.stability.current * 100}>
          Stability: {(pattern.metrics.stability.current * 100).toFixed(0)}%
        </Metric>
        <Metric value={pattern.resonance * 100}>
          Resonance: {(pattern.resonance * 100).toFixed(0)}%
        </Metric>
      </MetricsGrid>
    </PatternContainer>
  );
}; 