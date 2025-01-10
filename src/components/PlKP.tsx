import React, { useEffect, useRef } from 'react';
import { useNaturalFlow } from '../hooks/useNaturalFlow';
import { useNaturalSystem } from '../hooks/useNaturalSystem';

interface FlowStateIndicatorProps {
  size?: number;
  showMetrics?: boolean;
}

export const FlowStateIndicator: React.FC<FlowStateIndicatorProps> = ({
  size = 200,
  showMetrics = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    isInFlow,
    flowIntensity,
    flowCoherence,
    flowResonance,
    isProtected,
    protectFlow
  } = useNaturalFlow();

  const { systemState } = useNaturalSystem();
  const autonomousMetrics = systemState.autonomousMetrics;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Center point
    const centerX = size / 2;
    const centerY = size / 2;
    const maxRadius = (size / 2) * 0.8;

    // Draw flow state circle
    const drawFlowCircle = () => {
      ctx.beginPath();
      ctx.arc(centerX, centerY, maxRadius * flowIntensity, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${flowCoherence})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Protection layer
      if (isProtected) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, maxRadius * 1.1, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    };

    // Draw resonance waves
    const drawResonanceWaves = () => {
      const waveCount = 3;
      const baseRadius = maxRadius * 0.5;

      for (let i = 0; i < waveCount; i++) {
        const phase = (Date.now() / 1000 + i * 0.5) % (Math.PI * 2);
        const radius = baseRadius + (Math.sin(phase) * maxRadius * 0.1 * flowResonance);

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + (i * 0.1)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    };

    // Draw flow indicators
    const drawFlowIndicators = () => {
      const indicatorCount = 8;
      const indicatorLength = maxRadius * 0.2;

      for (let i = 0; i < indicatorCount; i++) {
        const angle = (i / indicatorCount) * Math.PI * 2;
        const x1 = centerX + Math.cos(angle) * maxRadius;
        const y1 = centerY + Math.sin(angle) * maxRadius;
        const x2 = centerX + Math.cos(angle) * (maxRadius + indicatorLength * flowIntensity);
        const y2 = centerY + Math.sin(angle) * (maxRadius + indicatorLength * flowIntensity);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${flowCoherence * 0.5})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    };

    // Add autonomous execution visualization
    const drawAutonomousMetrics = () => {
      if (!ctx || !autonomousMetrics) return;

      const { continuity, efficiency, adaptability } = autonomousMetrics;
      const metrics = [
        { value: continuity, color: 'rgba(255, 215, 0, 0.6)' },  // Gold
        { value: efficiency, color: 'rgba(192, 192, 192, 0.6)' }, // Silver
        { value: adaptability, color: 'rgba(205, 127, 50, 0.6)' } // Bronze
      ];

      const arcSize = Math.PI * 0.5; // Quarter circle for each metric
      const startAngle = Math.PI * 1.25; // Start at top-right

      metrics.forEach((metric, i) => {
        const angle = startAngle + (i * arcSize);
        ctx.beginPath();
        ctx.arc(
          centerX,
          centerY,
          maxRadius * 1.2,
          angle,
          angle + arcSize * metric.value,
          false
        );
        ctx.strokeStyle = metric.color;
        ctx.lineWidth = 3;
        ctx.stroke();
      });
    };

    // Update animation frame to include autonomous metrics
    const animate = () => {
      ctx.clearRect(0, 0, size, size);
      
      if (isInFlow) {
        drawResonanceWaves();
      }
      
      drawFlowCircle();
      drawFlowIndicators();
      if (autonomousMetrics) {
        drawAutonomousMetrics();
      }
      
      requestAnimationFrame(animate);
    };

    // Start animation
    const animationFrame = requestAnimationFrame(animate);

    // Auto-protect flow state
    if (isInFlow && flowIntensity > 0.8) {
      protectFlow();
    }

    return () => cancelAnimationFrame(animationFrame);
  }, [
    size,
    isInFlow,
    flowIntensity,
    flowCoherence,
    flowResonance,
    isProtected,
    protectFlow
  ]);

  return (
    <div className="flow-state-indicator">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{
          background: '#1a1a1a',
          borderRadius: '50%',
          padding: '1rem'
        }}
      />
      {showMetrics && (
        <div
          style={{
            marginTop: '1rem',
            fontSize: '0.875rem',
            color: 'rgba(255, 255, 255, 0.7)',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '0.5rem',
            textAlign: 'left'
          }}
        >
          <div>Flow: {isInFlow ? 'Active' : 'Inactive'}</div>
          <div>Protected: {isProtected ? 'Yes' : 'No'}</div>
          <div>Intensity: {(flowIntensity * 100).toFixed(1)}%</div>
          <div>Coherence: {(flowCoherence * 100).toFixed(1)}%</div>
          <div>Resonance: {(flowResonance * 100).toFixed(1)}%</div>
          {autonomousMetrics && (
            <>
              <div>Continuity: {(autonomousMetrics.continuity * 100).toFixed(1)}%</div>
              <div>Efficiency: {(autonomousMetrics.efficiency * 100).toFixed(1)}%</div>
              <div>Adaptability: {(autonomousMetrics.adaptability * 100).toFixed(1)}%</div>
            </>
          )}
        </div>
      )}
    </div>
  );
};