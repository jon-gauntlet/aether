import { useState, useCallback } from 'react';
import type { FlowState } from '../types/base';

interface FlowMetrics {
  velocity: number;
  focus: number;
  energy: number;
}

const DEFAULT_FLOW_STATE: FlowState = 'RESTING';

export function useFlow() {
  const [flowState, setFlowState] = useState<FlowState>(DEFAULT_FLOW_STATE);
  const [metrics, setMetrics] = useState<FlowMetrics>({
    velocity: 0,
    focus: 0,
    energy: 0
  });

  const updateFlow = useCallback((newState: FlowState) => {
    setFlowState(newState);
  }, []);

  const updateMetrics = useCallback((newMetrics: Partial<FlowMetrics>) => {
    setMetrics(prev => ({
      ...prev,
      ...newMetrics
    }));
  }, []);

  return {
    flowState,
    metrics,
    updateFlow,
    updateMetrics
  };
} 