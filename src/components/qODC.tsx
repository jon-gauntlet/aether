import React from 'react';
import { Card } from '../base/Card';
import { Button } from '../base/Button';
import { usePatternContext } from '../../core/hooks/usePatternContext';
import { Pattern } from '../../core/types/patterns';
import './PatternMonitor.css';

interface PatternMonitorProps {
  className?: string;
}

export const PatternMonitor: React.FC<PatternMonitorProps> = ({
  className = '',
}) => {
  const { activePatterns, evolvePattern, removePattern } = usePatternContext();

  const renderPatternStrength = (strength: number) => {
    const maxDots = 5;
    const dots = Math.min(maxDots, Math.floor(strength));
    return Array(maxDots)
      .fill('○')
      .fill('●', 0, dots)
      .join(' ');
  };

  const renderEvolutionStage = (pattern: Pattern) => {
    const stageLabels = ['Emerging', 'Growing', 'Established', 'Refined', 'Mastered'];
    const stage = Math.min(pattern.evolution.stage, stageLabels.length - 1);
    return stageLabels[stage];
  };

  return (
    <Card 
      variant="elevated"
      flowAware
      patternGuided
      className={`pattern-monitor ${className}`}
    >
      <div className="pattern-monitor-header">
        <h3>Pattern Evolution</h3>
      </div>

      <div className="pattern-monitor-content">
        {activePatterns.length === 0 ? (
          <div className="no-patterns">
            <p>No active patterns</p>
          </div>
        ) : (
          <div className="pattern-list">
            {activePatterns.map(pattern => (
              <div key={pattern.id} className="pattern-item">
                <div className="pattern-info">
                  <div className="pattern-header">
                    <span className="pattern-name">{pattern.name}</span>
                    <span className="pattern-type">{pattern.type}</span>
                  </div>
                  
                  <div className="pattern-metrics">
                    <div className="pattern-strength">
                      <label>Strength</label>
                      <span className="strength-indicator">
                        {renderPatternStrength(pattern.strength)}
                      </span>
                    </div>
                    
                    <div className="pattern-stage">
                      <label>Stage</label>
                      <span className="stage-indicator">
                        {renderEvolutionStage(pattern)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pattern-actions">
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => evolvePattern(pattern.id)}
                  >
                    Evolve
                  </Button>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => removePattern(pattern.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}; 