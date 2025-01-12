import { useState, useCallback, useEffect } from 'react';
import { usePattern } from './usePattern';
import { useEnergy } from '../energy/useEnergy';
import { Pattern } from './types';
import { Context, ContextType } from '../context/types';
import { Energy, EnergyType, FlowState as EnergyFlowState } from '../energy/types';
import { Flow, FlowStateType } from '../flow/types';

export interface AutonomicState {
  inFlow: boolean;
  energyLevel: number;
  hasActivePattern: boolean;
  learningCount: number;
  lastInsight?: string;
  currentPattern?: Pattern;
}

interface UseAutonomicOptions {
  task: string;
  energyType?: EnergyType;
  onStateChange?: (state: AutonomicState) => void;
  onLowEnergy?: () => void;
  onCriticalEnergy?: () => void;
}

export function useAutonomic({
  task,
  energyType = EnergyType.Mental,
  onStateChange,
  onLowEnergy,
  onCriticalEnergy
}: UseAutonomicOptions) {
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
    isLoading: patternLoading,
    error: patternError,
    recordLearning,
    getContextHistory
  } = usePattern(context, energy, flow);

  // Track state
  const [state, setState] = useState<AutonomicState>({
    inFlow: false,
    energyLevel: 100,
    hasActivePattern: false,
    learningCount: 0
  });

  // Update state when components change
  useEffect(() => {
    const newState: AutonomicState = {
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

  // Record success
  const recordSuccess = useCallback(async () => {
    if (pattern) {
      const evolvedPattern = await recordLearning('Pattern applied successfully');
      return evolvedPattern;
    }
  }, [pattern, recordLearning]);

  // Record improvement needed
  const recordImprovement = useCallback(async (details: string) => {
    if (pattern) {
      const evolvedPattern = await recordLearning(`Pattern needs improvement: ${details}`);
      return evolvedPattern;
    }
  }, [pattern, recordLearning]);

  // Handle flow state changes
  const handleFlowStart = useCallback((trigger: string) => {
    enterFlow(trigger);
  }, [enterFlow]);

  const handleFlowEnd = useCallback((reason: string) => {
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

  return {};
}