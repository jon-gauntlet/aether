import React from 'react';
import { Card } from '../base/Card';
import { usePatternContext } from '../../core/hooks/usePatternContext';
import { Pattern } from '../../core/types/patterns';
import './PatternStats.css';

interface PatternStatsProps {
  className?: string;
}

interface PatternTypeStats {
  count: number;
  avgStrength: number;
  maxStage: number;
}

export const PatternStats: React.FC<PatternStatsProps> = ({
  className = '',
}) => {
  const { activePatterns } = usePatternContext();

  const calculateTypeStats = (patterns: Pattern[]): Record<Pattern['type'], PatternTypeStats> => {
    const stats: Record<Pattern['type'], PatternTypeStats> = {
      flow: { count: 0, avgStrength: 0, maxStage: 0 },
      development: { count: 0, avgStrength: 0, maxStage: 0 },
      integration: { count: 0, avgStrength: 0, maxStage: 0 }
    };

    patterns.forEach(pattern => {
      const typeStats = stats[pattern.type];
      typeStats.count++;
      typeStats.avgStrength = (typeStats.avgStrength * (typeStats.count - 1) + pattern.strength) / typeStats.count;
      typeStats.maxStage = Math.max(typeStats.maxStage, pattern.evolution.stage);
    });

    return stats;
  };

  const typeStats = calculateTypeStats(activePatterns);
  const totalPatterns = activePatterns.length;
  const avgStrength = activePatterns.reduce((sum, p) => sum + p.strength, 0) / totalPatterns || 0;
  const maxStage = Math.max(...activePatterns.map(p => p.evolution.stage), 0);

  return (
    <Card
      variant="elevated"
      flowAware
      patternGuided
      className={`pattern-stats ${className}`}
    >
      <div className="pattern-stats-header">
        <h3>Pattern Insights</h3>
      </div>

      <div className="pattern-stats-content">
        <div className="stats-overview">
          <div className="stat-item">
            <label>Total Patterns</label>
            <span className="stat-value">{totalPatterns}</span>
          </div>
          <div className="stat-item">
            <label>Average Strength</label>
            <span className="stat-value">{avgStrength.toFixed(1)}</span>
          </div>
          <div className="stat-item">
            <label>Max Evolution Stage</label>
            <span className="stat-value">{maxStage}</span>
          </div>
        </div>

        <div className="type-stats">
          <h4>Pattern Types</h4>
          {Object.entries(typeStats).map(([type, stats]) => (
            <div key={type} className="type-stat-item">
              <div className="type-header">
                <span className="type-name">
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </span>
                <span className="type-count">{stats.count}</span>
              </div>
              <div className="type-metrics">
                <div className="metric">
                  <label>Avg Strength</label>
                  <span>{stats.avgStrength.toFixed(1)}</span>
                </div>
                <div className="metric">
                  <label>Max Stage</label>
                  <span>{stats.maxStage}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}; 