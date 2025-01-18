import { FlowState, FlowMetrics, Protection, Resonance, Pattern, DevelopmentPhase } from './base';
import { Observable } from 'rxjs';
import { useState, useEffect, useCallback } from 'react';

/**
 * @typedef {Object} AutonomicState
 * @property {string} id
 * @property {string} type
 * @property {FlowState} flow
 * @property {EnhancedEnergyState} energy
 * @property {ContextState} context
 * @property {Protection} protection
 * @property {Resonance} resonance
 * @property {Pattern[]} patterns
 * @property {number} timestamp
 */

/**
 * @typedef {Object} EnhancedEnergyState
 * @property {string} id
 * @property {number} level
 * @property {number} capacity
 * @property {number} focusMultiplier
 * @property {number} recoveryEfficiency
 * @property {number} sustainedDuration
 * @property {DevelopmentPhase} developmentPhase
 */

/**
 * @typedef {Object} ContextState
 * @property {string} id
 * @property {FlowState} flow
 * @property {ContextMetrics} metrics
 * @property {Protection} protection
 * @property {number} timestamp
 */

/**
 * @typedef {Object} ContextMetrics
 * @property {number} stability
 * @property {number} adaptability
 * @property {number} resilience
 * @augments FlowMetrics
 */

/**
 * @typedef {Object} AutonomicSystem
 * @property {Observable<AutonomicState>} state$
 * @property {function(Partial<AutonomicState>): void} updateState
 * @property {function(Partial<AutonomicState>): Promise<boolean>} validateState
 * @property {function(string[]): Promise<AutonomicState>} predictState
 */

/**
 * @typedef {Object} EnergySystem
 * @property {Observable<EnhancedEnergyState>} state$
 * @property {function(Partial<EnhancedEnergyState>): void} updateState
 * @property {function(Partial<EnhancedEnergyState>): Promise<boolean>} validateState
 */

/**
 * @typedef {Object} UseAutonomicOptions
 * @property {string} task
 * @property {EnergyType} [energyType=EnergyType.Mental]
 * @property {function(AutonomicState): void} onStateChange
 * @property {function(): void} onLowEnergy
 * @property {function(): void} onCriticalEnergy
 */

/**
 * Hook for managing autonomic state
 * @param {UseAutonomicOptions} options
 * @returns {Object} Autonomic state and management functions
 */
export function useAutonomic({
  task,
  energyType = EnergyType.Mental,
  onStateChange,
  onLowEnergy,
  onCriticalEnergy
}) {
  // Create context
  const context = {
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

  // Use energy system
  const {
    energy,
    enterFlow,
    exitFlow,
    rest,
    boost,
    isLow,
    isCritical,
    inFlow
  } = useEnergy(energyType);

  // Create flow state
  const flow = {
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
    isLoading: patternLoading,
    error: patternError,
    recordLearning,
    getContextHistory
  } = usePattern(context, energy, flow);

  // Track state
  const [state, setState] = useState({
    inFlow: false,
    energyLevel: 100,
    hasActivePattern: false,
    learningCount: 0
  });

  // Update state when components change
  useEffect(() => {
    const newState = {
      inFlow,
      energyLevel: energy.current,
      hasActivePattern: !!pattern,
      learningCount: pattern?.meta.learnings.length || 0,
      lastInsight: pattern?.meta.learnings[pattern.meta.learnings.length - 1]?.insight,
      currentPattern: pattern || undefined
    };

    setState(newState);
    if (onStateChange) {
      onStateChange(newState);
    }
  }, [inFlow, energy.current, pattern, onStateChange]);

  // Handle energy states
  useEffect(() => {
    if (isLow && onLowEnergy) {
      onLowEnergy();
    }
    if (isCritical && onCriticalEnergy) {
      onCriticalEnergy();
    }
  }, [isLow, isCritical, onLowEnergy, onCriticalEnergy]);

  /**
   * Record a successful pattern application
   * @returns {Promise<Pattern|undefined>}
   */
  const recordSuccess = useCallback(async () => {
    if (pattern) {
      const evolvedPattern = await recordLearning('Pattern applied successfully');
      return evolvedPattern;
    }
  }, [pattern, recordLearning]);

  /**
   * Record needed improvements for the pattern
   * @param {string} details - Details about needed improvements
   * @returns {Promise<Pattern|undefined>}
   */
  const recordImprovement = useCallback(async (details) => {
    if (pattern) {
      const evolvedPattern = await recordLearning(`Pattern needs improvement: ${details}`);
      return evolvedPattern;
    }
  }, [pattern, recordLearning]);

  /**
   * Start flow state
   * @param {string} trigger - What triggered the flow state
   */
  const handleFlowStart = useCallback((trigger) => {
    enterFlow(trigger);
  }, [enterFlow]);

  /**
   * End flow state
   * @param {string} reason - Reason for ending flow state
   */
  const handleFlowEnd = useCallback((reason) => {
    exitFlow(reason);
  }, [exitFlow]);

  return {
    state,
    energy,
    pattern,
    isLoading: patternLoading,
    error: patternError,
    actions: {
      enterFlow: handleFlowStart,
      exitFlow: handleFlowEnd,
      rest,
      boost,
      recordSuccess,
      recordImprovement
    },
    history: {
      getContextHistory,
      getLearnings: () => pattern?.meta.learnings || []
    }
  };
} 