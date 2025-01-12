import React, { useEffect } from 'react';
import { useSpace } from './SpaceProvider';
import { useFlowState } from '../hooks/useFlowState';
import { useProtection } from '../hooks/useProtection';
import './Sanctuary.css';

interface SanctuaryProps {
  onStateChange?: (state: any) => void;
  onProtectionBreak?: () => void;
}

export const Sanctuary: React.FC<SanctuaryProps> = ({
  onStateChange,
  onProtectionBreak
}) => {
  const { currentSpace } = useSpace();
  const { flowState, startFlow, updateIntensity } = useFlowState();
  const { protection, checkHealth, reinforce } = useProtection();

  // Auto-start enhanced flow state when entering sanctuary
  useEffect(() => {
    if (currentSpace.type === 'sanctuary' && !flowState.active) {
      startFlow().then(() => {
        // Gradually increase intensity for deep focus
        setTimeout(() => updateIntensity('high'), 5 * 60 * 1000); // After 5 minutes
        setTimeout(() => updateIntensity('peak'), 15 * 60 * 1000); // After 15 minutes
      });
    }
  }, [currentSpace.type, flowState.active, startFlow, updateIntensity]);

  // Enhanced protection in sanctuary
  useEffect(() => {
    if (currentSpace.type === 'sanctuary' && flowState.active) {
      const interval = setInterval(() => {
        const health = checkHealth();
        if (Object.values(health).some(metric => metric < 0.9)) {
          reinforce(0.15); // Stronger reinforcement in sanctuary
        }
      }, 2 * 60 * 1000); // Check every 2 minutes
      return () => clearInterval(interval);
    }
  }, [currentSpace.type, flowState.active, checkHealth, reinforce]);

  // Monitor state changes
  useEffect(() => {
    if (currentSpace.type === 'sanctuary') {
      const state = {
        flow: flowState,
        protection: protection,
        space: currentSpace,
        metrics: {
          focus: flowState.metrics.focus,
          energy: flowState.metrics.energy,
          clarity: flowState.metrics.clarity,
          stability: protection.metrics.stability
        }
      };
      onStateChange?.(state);
    }
  }, [currentSpace, flowState, protection, onStateChange]);

  // Protection break detection
  useEffect(() => {
    if (
      currentSpace.type === 'sanctuary' &&
      flowState.active &&
      Object.values(protection.metrics).some(metric => metric < 0.8)
    ) {
      onProtectionBreak?.();
    }
  }, [currentSpace.type, flowState.active, protection.metrics, onProtectionBreak]);

  return (
    <div className="sanctuary">
      <div className="sanctuary-header">
        <h1>Sanctuary</h1>
        <div className="flow-state">
          <div className="flow-indicator">
            <span className={`status ${flowState.active ? 'active' : ''}`}>
              {flowState.active ? 'Deep Flow' : 'Preparing'}
            </span>
            <span className="intensity">{flowState.intensity}</span>
          </div>
          <div className="protection-shield">
            <span className="shield-status">
              Shield: {Math.round(protection.metrics.stability * 100)}%
            </span>
          </div>
        </div>
      </div>

      <div className="focus-zone">
        <div className="metrics-circle">
          <svg viewBox="0 0 100 100" className="metrics-svg">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="var(--accent-subtle)"
              strokeWidth="2"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="var(--accent-primary)"
              strokeWidth="4"
              strokeDasharray={`${flowState.metrics.focus * 283} 283`}
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="metrics-content">
            <div className="focus-level">
              {Math.round(flowState.metrics.focus * 100)}%
            </div>
            <div className="focus-label">Focus</div>
          </div>
        </div>
      </div>

      <div className="metrics-panel">
        <div className="metric">
          <label>Energy</label>
          <progress value={flowState.metrics.energy} max={1} />
        </div>
        <div className="metric">
          <label>Clarity</label>
          <progress value={flowState.metrics.clarity} max={1} />
        </div>
        <div className="metric">
          <label>Protection</label>
          <progress value={protection.metrics.stability} max={1} />
        </div>
      </div>

      {flowState.active && (
        <div className="duration-display">
          <span className="duration-label">Session Duration</span>
          <span className="duration-time">
            {Math.floor(flowState.duration / (60 * 60 * 1000))}h{' '}
            {Math.floor((flowState.duration % (60 * 60 * 1000)) / (60 * 1000))}m
          </span>
        </div>
      )}
    </div>
  );
}; 