import React, { useCallback } from 'react';
import { usePersistentPattern } from '../core/autonomic/usePersistentPattern';
import { Context, ContextType } from '../core/context/types';
import { Energy, EnergyType, FlowState as EnergyFlowState } from '../core/energy/types';
import { Flow, FlowStateType } from '../core/flow/types';
import './PersistentPatternGuided.css';

interface PersistentPatternGuidedProps {
  task: string;
  children: React.ReactNode;
  onStateChange?: (state: any) => void;
  onPatternLoad?: () => void;
  onPatternError?: (error: Error) => void;
}

export const PersistentPatternGuided: React.FC<PersistentPatternGuidedProps> = ({
  task,
  children,
  onStateChange,
  onPatternLoad,
  onPatternError
}) => {
  // Create context
  const context: Context = {
    id: `task-${task}`,
    type: ContextType.Development,
    depth: 1,
    children: [],
    meta: {
      created: new Date(),
      lastAccessed: new Date(),
      accessCount: 0,
      importance: 1,
      tags: ['development', 'task', task]
    },
    data: { task }
  };

  // Create energy state
  const energy: Energy = {
    current: 100,
    max: 100,
    type: EnergyType.Mental,
    flow: EnergyFlowState.Flow,
    meta: {
      timestamp: new Date(),
      duration: 0,
      source: 'development',
      triggers: [],
      notes: ''
    }
  };

  // Create flow state
  const flow: Flow = {
    state: FlowStateType.Focused,
    context: {
      task,
      goal: 'Complete task with pattern guidance',
      constraints: [],
      resources: []
    },
    duration: 0,
    meta: {
      started: new Date(),
      lastTransition: new Date(),
      transitions: [],
      metrics: {
        productivity: 1,
        quality: 1,
        energy: 1,
        satisfaction: 1
      }
    }
  };

  // Use persistent pattern system
  const {
    pattern,
    isLoading,
    error,
    stats,
    actions,
    getters
  } = usePersistentPattern(context, energy, flow);

  // Handle pattern load
  React.useEffect(() => {
    if (pattern && onPatternLoad) {
      onPatternLoad();
    }
  }, [pattern, onPatternLoad]);

  // Handle errors
  React.useEffect(() => {
    if (error && onPatternError) {
      onPatternError(error);
    }
  }, [error, onPatternError]);

  // Handle state changes
  React.useEffect(() => {
    if (onStateChange) {
      onStateChange({
        pattern,
        stats,
        isLoading,
        error
      });
    }
  }, [pattern, stats, isLoading, error, onStateChange]);

  // Record success
  const handleSuccess = useCallback(async () => {
    await actions.recordLearning('Pattern applied successfully');
  }, [actions]);

  // Record improvement needed
  const handleImprovement = useCallback(async () => {
    await actions.recordLearning('Pattern needs improvement');
  }, [actions]);

  // Export patterns
  const handleExport = useCallback(() => {
    const data = actions.exportPatterns();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'patterns.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [actions]);

  // Import patterns
  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result;
        if (typeof content === 'string') {
          await actions.importPatterns(content);
        }
      };
      reader.readAsText(file);
    }
  }, [actions]);

  if (isLoading) {
    return <div className="pattern-loading">Loading pattern...</div>;
  }

  if (error) {
    return <div className="pattern-error">Error: {error.message}</div>;
  }

  return (
    <div className="persistent-pattern-guided">
      <div className="pattern-header">
        <div className="pattern-info">
          {pattern ? (
            <>
              <h3>Active Pattern: {pattern.name}</h3>
              <p>{pattern.description}</p>
              <div className="pattern-stats">
                <span>Success Rate: {(pattern.meta.successRate * 100).toFixed(1)}%</span>
                <span>Uses: {pattern.meta.useCount}</span>
              </div>
            </>
          ) : (
            <p>No active pattern</p>
          )}
        </div>

        <div className="pattern-actions">
          <button onClick={handleExport} className="export-btn">
            Export Patterns
          </button>
          <label className="import-btn">
            Import Patterns
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      <div className="pattern-stats-overview">
        <h4>System Stats</h4>
        {stats && (
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Total Patterns</span>
              <span className="stat-value">{stats.totalPatterns}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Learnings</span>
              <span className="stat-value">{stats.totalLearnings}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Average Success</span>
              <span className="stat-value">
                {(stats.averageSuccessRate * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="pattern-content">
        {children}
      </div>

      {pattern && (
        <div className="pattern-feedback">
          <button onClick={handleSuccess} className="success-btn">
            Record Success
          </button>
          <button onClick={handleImprovement} className="improve-btn">
            Suggest Improvement
          </button>
        </div>
      )}

      {stats && stats.recentLearnings && stats.recentLearnings.length > 0 && (
        <div className="recent-learnings">
          <h4>Recent Learnings</h4>
          <ul>
            {stats.recentLearnings.map((learning, index) => (
              <li key={index}>
                <span className="learning-time">
                  {new Date(learning.timestamp).toLocaleTimeString()}
                </span>
                <span className="learning-insight">{learning.insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}; 