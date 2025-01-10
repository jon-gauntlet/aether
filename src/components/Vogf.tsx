import React, { useEffect } from 'react';
import { usePattern } from '../core/autonomic/usePattern';
import { Context, ContextType } from '../core/context/types';
import { Energy, EnergyType, FlowState as EnergyFlowState } from '../core/energy/types';
import { Flow, FlowStateType } from '../core/flow/types';

interface PatternGuidedProps {
  task: string;
  children: React.ReactNode;
}

export const PatternGuided: React.FC<PatternGuidedProps> = ({ task, children }) => {
  // Create context for this component
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

  // Track energy state
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

  // Track flow state
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

  // Use pattern system
  const {
    pattern,
    isLoading,
    error,
    recordLearning,
    getContextHistory
  } = usePattern(context, energy, flow);

  // Record completion
  useEffect(() => {
    return () => {
      if (pattern) {
        recordLearning('Task completed successfully')
          .catch(console.error);
      }
    };
  }, [pattern, recordLearning]);

  if (isLoading) {
    return <div>Loading pattern...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="pattern-guided">
      <div className="pattern-meta">
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
          <p>No pattern active</p>
        )}
      </div>
      
      <div className="pattern-content">
        {children}
      </div>

      {pattern && (
        <div className="pattern-feedback">
          <button
            onClick={() => recordLearning('Pattern applied successfully')}
            className="success-btn"
          >
            Record Success
          </button>
          <button
            onClick={() => recordLearning('Pattern needs improvement')}
            className="improve-btn"
          >
            Suggest Improvement
          </button>
        </div>
      )}
    </div>
  );
}; 