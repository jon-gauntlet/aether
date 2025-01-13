import { useState, useCallback } from 'react';
import { useFlowState } from './useFlowState';
import { useProtection } from './useProtection';
import { FlowState } from '../types/flow/types';
import { SpaceType, TransitionMetrics } from '../types/space/types';

const TRANSITION_THRESHOLDS = {
  minimal: 0.7,
  safe: 0.85,
  optimal: 0.95
};

interface TransitionState {
  inProgress: boolean;
  from: SpaceType | null;
  to: SpaceType | null;
  startTime: number | null;
  metrics: TransitionMetrics;
}

const DEFAULT_METRICS: TransitionMetrics = {
  coherence: 0.9,
  stability: 0.9,
  efficiency: 0.85,
  preservation: 0.9
};

export const useSpaceTransition = () => {
  const { flowState, updateMetrics } = useFlowState();
  const { protection, checkHealth, reinforce } = useProtection();
  
  const [transition, setTransition] = useState<TransitionState>({
    inProgress: false,
    from: null,
    to: null,
    startTime: null,
    metrics: DEFAULT_METRICS
  });

  const validateTransition = useCallback((from: SpaceType, to: SpaceType): boolean => {
    const healthCheck = checkHealth();
    const metricsCheck = Object.values(healthCheck).every(
      metric => metric >= TRANSITION_THRESHOLDS.safe
    );

    // Ensure flow state is stable enough for transition
    if (flowState.active && !metricsCheck) {
      reinforce(0.1); // Boost protection before transition
      return false;
    }

    return true;
  }, [checkHealth, flowState.active, reinforce]);

  const startTransition = useCallback(async (from: SpaceType, to: SpaceType): Promise<boolean> => {
    if (!validateTransition(from, to)) {
      return false;
    }

    // Preserve current state
    const previousMetrics = { ...flowState.metrics };
    
    setTransition(prev => ({
      ...prev,
      inProgress: true,
      from,
      to,
      startTime: Date.now(),
      metrics: {
        ...prev.metrics,
        coherence: 1,
        stability: 1,
        efficiency: 1,
        preservation: 1
      }
    }));

    // Update flow metrics to reflect transition
    updateMetrics();

    return true;
  }, [flowState.metrics, updateMetrics, validateTransition]);

  const completeTransition = useCallback(async (): Promise<boolean> => {
    if (!transition.inProgress) {
      return false;
    }

    const duration = Date.now() - (transition.startTime || 0);
    const efficiency = Math.min(1, 2000 / duration); // Optimal transition < 2s

    setTransition(prev => ({
      ...prev,
      inProgress: false,
      from: null,
      to: null,
      startTime: null,
      metrics: {
        ...prev.metrics,
        efficiency
      }
    }));

    // Final protection reinforcement
    reinforce(0.05);

    return true;
  }, [reinforce, transition.inProgress, transition.startTime]);

  const cancelTransition = useCallback(() => {
    setTransition(prev => ({
      ...prev,
      inProgress: false,
      from: null,
      to: null,
      startTime: null
    }));
  }, []);

  return {
    transition,
    startTransition,
    completeTransition,
    cancelTransition,
    validateTransition
  };
}; 