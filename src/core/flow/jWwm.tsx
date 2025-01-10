import React from 'react';
import { Card } from '../base/Card';
import { Button } from '../base/Button';
import { useFlowState } from '../../core/hooks/useFlowState';
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
    releaseFlow
  } = useFlowState();

  return (
    <Card 
      variant="elevated"
      flowAware
      className={`flow-monitor ${className}`}
    >
      <div className="flow-monitor-header">
        <h3>Flow Control</h3>
        <Button
          variant="text"
          size="small"
          onClick={currentFlow === 'focus' ? releaseFlow : protectFlow}
        >
          {currentFlow === 'focus' ? 'Release' : 'Protect'}
        </Button>
      </div>

      <div className="flow-monitor-content">
        <div className="flow-controls">
          <label>Flow State</label>
          <div className="flow-buttons">
            {(['focus', 'flow', 'rest'] as const).map(state => (
              <Button
                key={state}
                variant={currentFlow === state ? 'primary' : 'secondary'}
                size="small"
                onClick={() => setFlow(state)}
              >
                {state}
              </Button>
            ))}
          </div>
        </div>

        <div className="level-controls">
          <label>Energy Level</label>
          <div className="level-buttons">
            {(['high', 'medium', 'low'] as const).map(level => (
              <Button
                key={level}
                variant={flowLevel === level ? 'primary' : 'secondary'}
                size="small"
                onClick={() => setFlowLevel(level)}
              >
                {level}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}; 