import React, { useCallback } from 'react';
import { usePatternLibrary } from '../core/hooks/usePatternLibrary';
import { useAutonomicSystem } from '../core/hooks/useAutonomicSystem';
import { Pattern } from '../types/patterns';
import './PatternVisualization.css';

interface PatternVisualizationProps {
  onPatternSelect?: (pattern: Pattern) => void;
}

export const PatternVisualization: React.FC<PatternVisualizationProps> = ({
  onPatternSelect
}) => {
  const { patterns } = usePatternLibrary();
  const { state } = useAutonomicSystem();

  const getStateClasses = useCallback((pattern: Pattern) => {
    return pattern.states.map(state => state.toLowerCase()).join(' ');
  }, []);

  const getSystemClasses = useCallback(() => {
    const classes = [];
    if (state.energy > 0.8) classes.push('high-energy');
    if (state.context > 2) classes.push('deep-context');
    if (state.protection > 1) classes.push('protected');
    return classes.join(' ');
  }, [state]);

  const formatMetric = useCallback((value: number) => {
    return `${Math.round(value * 100)}%`;
  }, []);

  const handlePatternClick = useCallback((pattern: Pattern) => {
    onPatternSelect?.(pattern);
  }, [onPatternSelect]);

  return (
    <div 
      className={`pattern-visualization ${getSystemClasses()}`}
      data-testid="pattern-visualization"
    >
      <div className="patterns-container">
        {patterns.map(pattern => (
          <div
            key={pattern.id}
            className={`pattern-node ${getStateClasses(pattern)}`}
            data-testid={pattern.id}
            onClick={() => handlePatternClick(pattern)}
          >
            <h3>{pattern.name}</h3>
            <div className="pattern-details">
              <p>{pattern.description}</p>
              <div className="metrics">
                <div className="metric">
                  <label>Energy Level:</label>
                  <span>{formatMetric(pattern.energyLevel)}</span>
                </div>
                <div className="metric">
                  <label>Success Rate:</label>
                  <span>{formatMetric(pattern.successRate)}</span>
                </div>
              </div>
              <div className="context-tags">
                {pattern.context.map(tag => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="states">
                {pattern.states.map(state => (
                  <span key={state} className={`state ${state.toLowerCase()}`}>
                    {state}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 