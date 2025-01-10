import React from 'react';
import { Card } from '../base/Card';
import { useFlowState } from '../../core/hooks/useFlowState';
import { usePatternContext } from '../../core/hooks/usePatternContext';
import './StateCard.css';

interface StateCardProps {
  title?: string;
  showPatterns?: boolean;
  className?: string;
}

export const StateCard: React.FC<StateCardProps> = ({
  title = 'Current State',
  showPatterns = true,
  className = '',
}) => {
  const { currentFlow, flowLevel } = useFlowState();
  const { activePatterns } = usePatternContext();

  return (
    <Card 
      variant="elevated"
      flowAware
      patternGuided
      className={`state-card ${className}`}
    >
      <div className="state-card-header">
        <h3>{title}</h3>
      </div>
      
      <div className="state-card-content">
        <div className="state-info">
          <div className="flow-state">
            <label>Flow State</label>
            <span className={`flow-indicator flow-${currentFlow}`}>
              {currentFlow}
            </span>
          </div>
          
          <div className="flow-level">
            <label>Energy Level</label>
            <span className={`level-indicator level-${flowLevel}`}>
              {flowLevel}
            </span>
          </div>
        </div>

        {showPatterns && activePatterns.length > 0 && (
          <div className="pattern-list">
            <label>Active Patterns</label>
            {activePatterns.map(pattern => (
              <div key={pattern.id} className="pattern-item">
                <span className="pattern-name">{pattern.name}</span>
                <span className="pattern-strength">
                  {Array(Math.min(5, Math.floor(pattern.strength)))
                    .fill('●')
                    .join(' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}; 