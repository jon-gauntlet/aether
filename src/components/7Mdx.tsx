import React, { useCallback } from 'react';
import { usePatternLibrary } from '../core/hooks/usePatternLibrary';
import { useAutonomicSystem } from '../core/hooks/useAutonomicSystem';
import { Pattern } from '../types/patterns';
import { FlowType } from '../core/types/flow';
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
    if (state.energy.level > 0.8) classes.push('high-energy');
    if (state.context.depth > 0.7) classes.push('deep-context');
    if (state.protection.level > 0.7) classes.push('protected');
    if (state.flow.type === FlowType.GUIDED) classes.push('guided');
    if (state.flow.type === FlowType.PROTECTED) classes.push('protected-flow');
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
      <div className="system-metrics">
        <div className="metric">
          <label>Flow:</label>
          <span>{state.flow.type}</span>
        </div>
        <div className="metric">
          <label>Energy:</label>
          <span>{formatMetric(state.energy.level)}</span>
        </div>
        <div className="metric">
          <label>Context Depth:</label>
          <span>{formatMetric(state.context.depth)}</span>
        </div>
        <div className="metric">
          <label>Protection:</label>
          <span>{formatMetric(state.protection.level)}</span>
        </div>
      </div>
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