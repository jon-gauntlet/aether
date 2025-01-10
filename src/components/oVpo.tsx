import React, { useEffect, useRef } from 'react';
import { useNaturalSystem } from '../hooks/useNaturalSystem';

const GOLDEN_RATIO = 0.618033988749895;
const SILVER_RATIO = 0.414213562373095;
const BRONZE_RATIO = 0.302775637731995;

interface SystemMonitorProps {
  width?: number;
  height?: number;
}

export const SystemMonitor: React.FC<SystemMonitorProps> = ({
  width = 400,
  height = 300
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { systemState, quality, protection, metrics } = useNaturalSystem();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = protection ? '#1a1a1a' : '#2a1a1a';
    ctx.fillRect(0, 0, width, height);

    // Draw flow state
    const flowHeight = height * 0.4;
    const flowWidth = width * 0.8;
    const flowX = width * 0.1;
    const flowY = height * 0.1;

    // Flow intensity wave
    ctx.beginPath();
    ctx.moveTo(flowX, flowY + flowHeight / 2);
    for (let x = 0; x < flowWidth; x++) {
      const normalizedX = x / flowWidth;
      const y = flowY + flowHeight / 2 + 
        Math.sin(normalizedX * Math.PI * 4) * 
        (flowHeight / 4) * 
        systemState.flow.intensity;
      ctx.lineTo(flowX + x, y);
    }
    ctx.strokeStyle = `rgba(255, 255, 255, ${systemState.flow.coherence})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw pattern connections
    const patternSize = 8;
    const patterns = systemState.patterns;
    const centerX = width / 2;
    const centerY = height * 0.7;

    patterns.forEach((pattern, i) => {
      const angle = (i / patterns.length) * Math.PI * 2;
      const radius = height * 0.2 * pattern.strength;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      // Draw connection line
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = `rgba(255, 255, 255, ${pattern.confidence * 0.5})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw pattern node
      ctx.beginPath();
      ctx.arc(x, y, patternSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${pattern.confidence})`;
      ctx.fill();
    });

    // Draw metrics
    const metricsY = height * 0.9;
    const metricsWidth = width * 0.8;
    const metricsX = width * 0.1;

    // Coherence bar
    ctx.fillStyle = `rgba(255, 255, 255, ${GOLDEN_RATIO})`;
    ctx.fillRect(
      metricsX,
      metricsY,
      metricsWidth * metrics.coherence,
      4
    );

    // Stability bar
    ctx.fillStyle = `rgba(255, 255, 255, ${SILVER_RATIO})`;
    ctx.fillRect(
      metricsX,
      metricsY + 8,
      metricsWidth * metrics.stability,
      4
    );

    // Quality indicator
    ctx.beginPath();
    ctx.arc(
      width - 20,
      20,
      8,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = `rgba(255, 255, 255, ${quality})`;
    ctx.fill();

  }, [systemState, quality, protection, metrics, width, height]);

  return (
    <div className="system-monitor" style={{ padding: '1rem' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '4px',
          background: '#1a1a1a'
        }}
      />
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '0.5rem',
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '0.875rem'
      }}>
        <div>Quality: {(quality * 100).toFixed(1)}%</div>
        <div>Protection: {protection ? 'Active' : 'Inactive'}</div>
        <div>Coherence: {(metrics.coherence * 100).toFixed(1)}%</div>
        <div>Stability: {(metrics.stability * 100).toFixed(1)}%</div>
      </div>
    </div>
  );
}; 