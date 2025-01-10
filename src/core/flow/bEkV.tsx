import React from 'react';
import { Card } from '../base/Card';
import { Button } from '../base/Button';
import { useFlowState } from '../../core/hooks/useFlowState';
import { useEnergyAnalytics } from '../../core/hooks/useEnergyAnalytics';
import './FlowMonitor.css';

interface FlowMonitorProps {
  className?: string;
}

export const FlowMonitor: React.FC<FlowMonitorProps> = ({
  className = '',
}) => {
  const { 
    currentFlow, 
    flowLevel,
    setFlow,
    setFlowLevel,
    protectFlow,
    releaseFlow,
    isProtected
  } = useFlowState();

  const {
    averageFlowDuration,
    peakFlowFrequency,
    entropyTrend
  } = useEnergyAnalytics();

  const renderFlowStrength = (level: number) => {
    return Array(5)
      .fill('○')
      .fill('●', 0, Math.min(5, Math.floor(level * 5)))
      .join(' ');
  };

  return (
    <Card 
      variant="elevated"
      flowAware
      className={`flow-monitor ${className} flow-state-${currentFlow}`}
    >
      <div className="flow-monitor-header">
        <h3>Flow Control</h3>
        <div className="flow-actions">
          <Button
            variant={isProtected ? 'primary' : 'text'}
            size="small"
            onClick={isProtected ? releaseFlow : protectFlow}
            disabled={flowLevel !== 'high'}
          >
            {isProtected ? 'Protected' : 'Protect Flow'}
          </Button>
        </div>
      </div>

      <div className="flow-monitor-content">
        <div className="flow-section">
          <label>Flow State</label>
          <div className="flow-buttons">
            {(['focus', 'flow', 'rest'] as const).map(state => (
              <Button
                key={state}
                variant={currentFlow === state ? 'primary' : 'secondary'}
                size="small"
                onClick={() => setFlow(state)}
                disabled={isProtected}
              >
                {state}
              </Button>
            ))}
          </div>
        </div>

        <div className="flow-section">
          <label>Energy Level</label>
          <div className="flow-buttons">
            {(['low', 'medium', 'high'] as const).map(level => (
              <Button
                key={level}
                variant={flowLevel === level ? 'primary' : 'secondary'}
                size="small"
                onClick={() => setFlowLevel(level)}
                disabled={isProtected}
              >
                {level}
              </Button>
            ))}
          </div>
        </div>

        <div className="flow-analytics">
          <div className="analytics-item">
            <span>Average Flow Duration</span>
            <div className="analytics-value">
              {Math.round(averageFlowDuration)}m
            </div>
          </div>

          <div className="analytics-item">
            <span>Peak Flow Frequency</span>
            <div className="analytics-value">
              {peakFlowFrequency.toFixed(1)}/day
            </div>
          </div>

          <div className="analytics-item">
            <span>System Entropy</span>
            <div className="entropy-indicator">
              <div 
                className="entropy-bar"
                style={{
                  width: `${entropyTrend * 100}%`,
                  backgroundColor: entropyTrend > 0.7 
                    ? 'var(--color-error)' 
                    : entropyTrend > 0.4
                    ? 'var(--color-warning)'
                    : 'var(--color-success)'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}; 