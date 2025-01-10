import React, { useEffect, useState } from 'react';
import { usePatternManager } from '../core/hooks/usePatternManager';
import { Pattern } from '../core/types/autonomic';
import './PatternVisualization.css';

interface Props {
  maxPatterns?: number;
}

export function PatternVisualization({ maxPatterns = 10 }: Props) {
  const manager = usePatternManager();
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);

  useEffect(() => {
    const subscription = manager.library.subscribe(allPatterns => {
      const mostUsed = manager.library.getMostUsedPatterns(maxPatterns);
      const mostSuccessful = manager.library.getMostSuccessfulPatterns(maxPatterns);
      
      // Combine and deduplicate patterns
      const uniquePatterns = Array.from(new Set([...mostUsed, ...mostSuccessful]));
      setPatterns(uniquePatterns.slice(0, maxPatterns));
    });

    return () => subscription.unsubscribe();
  }, [manager.library, maxPatterns]);

  const handlePatternClick = (pattern: Pattern) => {
    setSelectedPattern(pattern);
    manager.setCurrent(pattern);
  };

  const calculatePatternSize = (pattern: Pattern): number => {
    const usageScore = pattern.metadata.uses / Math.max(...patterns.map(p => p.metadata.uses));
    const successScore = (pattern.metadata.success / pattern.metadata.uses) || 0;
    return 40 + (usageScore + successScore) * 30;
  };

  const calculatePatternPosition = (index: number, total: number) => {
    const angle = (index / total) * Math.PI * 2;
    const radius = 150;
    return {
      left: `${Math.cos(angle) * radius + radius}px`,
      top: `${Math.sin(angle) * radius + radius}px`
    };
  };

  return (
    <div className="pattern-visualization">
      <div className="pattern-orbit">
        {patterns.map((pattern, index) => (
          <div
            key={pattern.id}
            className={`pattern-node ${pattern.id === selectedPattern?.id ? 'selected' : ''}`}
            style={{
              ...calculatePatternPosition(index, patterns.length),
              width: `${calculatePatternSize(pattern)}px`,
              height: `${calculatePatternSize(pattern)}px`
            }}
            onClick={() => handlePatternClick(pattern)}
          >
            <div className="pattern-content">
              <div className="pattern-name">{pattern.name}</div>
              <div className="pattern-metrics">
                <div className="pattern-energy" style={{
                  height: `${pattern.energy * 100}%`
                }} />
                <div className="pattern-success" style={{
                  height: `${(pattern.metadata.success / pattern.metadata.uses) * 100}%`
                }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedPattern && (
        <div className="pattern-details">
          <h3>{selectedPattern.name}</h3>
          <p>{selectedPattern.description}</p>
          <div className="pattern-stats">
            <div className="stat">
              <label>Energy</label>
              <div className="stat-bar" style={{
                width: `${selectedPattern.energy * 100}%`
              }} />
            </div>
            <div className="stat">
              <label>Success Rate</label>
              <div className="stat-bar" style={{
                width: `${(selectedPattern.metadata.success / selectedPattern.metadata.uses) * 100}%`
              }} />
            </div>
            <div className="stat">
              <label>Protection</label>
              <div className="stat-bar" style={{
                width: `${selectedPattern.protection * 100}%`
              }} />
            </div>
          </div>
          <div className="pattern-context">
            <h4>Context</h4>
            <div className="context-tags">
              {selectedPattern.context.map(ctx => (
                <span key={ctx} className="context-tag">{ctx}</span>
              ))}
            </div>
          </div>
          <div className="pattern-states">
            <h4>States</h4>
            <div className="state-tags">
              {selectedPattern.states.map(state => (
                <span key={state} className="state-tag">{state}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 