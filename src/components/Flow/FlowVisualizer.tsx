import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useAutonomic } from '@/core/autonomic/useAutonomic';
import { FlowState } from '@/core/types/base';
import { ErrorBoundary } from '../ErrorBoundary';

const Container = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  background: ${({ theme }) => theme.colors.background};
  overflow: hidden;
`;

const Canvas = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;

const MetricsOverlay = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 1rem;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: 0.5rem;
  box-shadow: ${({ theme }) => theme.shadows.medium};
`;

const ErrorContainer = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 2rem;
  background: ${({ theme }) => theme.colors.error};
  color: ${({ theme }) => theme.colors.onError};
  border-radius: 0.5rem;
  box-shadow: ${({ theme }) => theme.shadows.large};
`;

interface FlowVisualizerProps {
  width?: number;
  height?: number;
}

const FlowVisualizerContent: React.FC<FlowVisualizerProps> = ({
  width = 800,
  height = 600
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { flowState } = useAutonomic();
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !flowState) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawFlow(ctx, flowState);
  }, [flowState, width, height]);

  const drawFlow = (ctx: CanvasRenderingContext2D, state: FlowState) => {
    ctx.clearRect(0, 0, width, height);
    
    try {
      // Draw sacred spaces
      state.spaces?.forEach(space => drawSacredSpace(ctx, space));
      
      // Draw patterns
      state.patterns?.forEach(pattern => drawPattern(ctx, pattern));
      
      // Draw resonance waves
      if (state.resonance) {
        drawResonance(ctx, state.resonance);
      }
    } catch (error) {
      console.error('Error drawing flow:', error);
    }
  };

  const drawSacredSpace = (ctx: CanvasRenderingContext2D, space: FlowState['spaces'][number]) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = space.protection.field.radius * 100;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `hsla(${space.type === 'flow' ? 240 : space.type === 'presence' ? 120 : 0}, 
      ${space.protection.strength * 100}%, 
      ${space.resonance.coherence * 100}%, 
      ${space.protection.field.coherence})`;
    ctx.lineWidth = space.protection.resilience * 5;
    ctx.stroke();
  };

  const drawPattern = (ctx: CanvasRenderingContext2D, pattern: FlowState['patterns'][number]) => {
    const x = (Math.random() * width * 0.8) + width * 0.1;
    const y = (Math.random() * height * 0.8) + height * 0.1;
    const size = pattern.strength * 20;

    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size, y + size);
    ctx.lineTo(x - size, y + size);
    ctx.closePath();
    
    ctx.fillStyle = `hsla(${pattern.type === 'flow' ? 240 : pattern.type === 'presence' ? 120 : 0},
      ${pattern.strength * 100}%,
      ${pattern.resonance * 100}%,
      ${pattern.evolution})`;
    ctx.fill();
  };

  const drawResonance = (ctx: CanvasRenderingContext2D, resonance: FlowState['resonance']) => {
    const waveHeight = height * 0.1;
    const frequency = resonance.primary.frequency;
    
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    
    for (let x = 0; x < width; x++) {
      const y = Math.sin(x * frequency) * waveHeight * resonance.primary.amplitude;
      ctx.lineTo(x, height / 2 + y);
    }
    
    ctx.strokeStyle = `hsla(240, 100%, 50%, ${resonance.coherence})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  return (
    <Container>
      <Canvas ref={canvasRef} width={width} height={height} />
      <MetricsOverlay>
        <h3>Flow Metrics</h3>
        <div>Coherence: {(flowState?.metrics.coherence ?? 0).toFixed(2)}</div>
        <div>Resonance: {(flowState?.metrics.resonance ?? 0).toFixed(2)}</div>
        <div>Presence: {(flowState?.metrics.presence ?? 0).toFixed(2)}</div>
      </MetricsOverlay>
    </Container>
  );
};

export const FlowVisualizer: React.FC<FlowVisualizerProps> = (props) => (
  <ErrorBoundary
    fallback={({ error }) => (
      <ErrorContainer>
        <h3>Flow Visualization Error</h3>
        <p>{error.message}</p>
      </ErrorContainer>
    )}
  >
    <FlowVisualizerContent {...props} />
  </ErrorBoundary>
); 