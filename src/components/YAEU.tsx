import React from 'react';
import { Card } from '../base/Card';
import { Button } from '../base/Button';
import { usePatternContext } from '../../core/hooks/usePatternContext';
import { Pattern, PatternStage } from '../../core/types/patterns';
import { formatTimeAgo } from '../../core/utils/time';
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
            {activePatterns.map((pattern: Pattern) => (
              <div key={pattern.id} className="pattern-card">
                <div className="pattern-header">
                  <h4>{pattern.name}</h4>
                  <div className="pattern-controls">
                    <Button
                      variant="text"
                      onClick={() => evolvePattern(pattern.id)}
                      disabled={pattern.evolution.entropyLevel > 0.7}
                    >
                      Evolve
                    </Button>
                    <Button
                      variant="text"
                      onClick={() => removePattern(pattern.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>

                <div className="pattern-metrics">
                  <div className="metric">
                    <span>Strength:</span>
                    <div className="strength-dots">
                      {renderPatternStrength(pattern.strength)}
                    </div>
                  </div>
                  
                  <div className="metric">
                    <span>Stage:</span>
                    <div className="stage-label">
                      {renderEvolutionStage(pattern)}
                    </div>
                  </div>

                  <div className="metric">
                    <span>Entropy:</span>
                    <div className="entropy-bar">
                      <div 
                        className="entropy-fill"
                        style={{
                          width: `${pattern.evolution.entropyLevel * 100}%`,
                          backgroundColor: pattern.evolution.entropyLevel > 0.7 
                            ? 'var(--color-error)' 
                            : pattern.evolution.entropyLevel > 0.4
                            ? 'var(--color-warning)'
                            : 'var(--color-success)'
                        }}
                      />
                    </div>
                  </div>

                  <div className="metric">
                    <span>Last Evolution:</span>
                    <div className="evolution-time">
                      {formatTimeAgo(pattern.evolution.lastEvolved)}
                    </div>
                  </div>
                </div>

                {pattern.metadata && (
                  <div className="pattern-metadata">
                    <div className="tags">
                      {pattern.metadata.tags.map(tag => (
                        <span key={tag} className="tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="category">
                      {pattern.metadata.category}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}; 