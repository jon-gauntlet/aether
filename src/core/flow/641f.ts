import { useEffect, useState, useCallback } from 'react';
import { FlowSpace, SpaceMetrics } from './FlowSpace';
import { FlowPattern, FlowType, FlowContext } from './FlowEngine';

interface UseFlowResult {
  // Core state
  metrics: SpaceMetrics;
  flows: FlowPattern[];
  
  // Actions
  enter: (type: FlowType, context?: FlowContext) => Promise<FlowPattern>;
  leave: (flowId: string) => Promise<void>;
  
  // Space qualities
  isReady: boolean;
  isBalanced: boolean;
  isEnergized: boolean;
}

const space = new FlowSpace();

export function useFlow(
  initialContext: FlowContext = {}
): UseFlowResult {
  const [metrics, setMetrics] = useState<SpaceMetrics>({
    openness: 0.7,
    balance: 0.5,
    energy: 0.3
  });
  const [flows, setFlows] = useState<FlowPattern[]>([]);

  useEffect(() => {
    const subscription = space.observe().subscribe(
      ({ metrics: newMetrics, flows: newFlows }) => {
        setMetrics(newMetrics);
        setFlows(newFlows);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const enter = useCallback(
    async (type: FlowType, context: FlowContext = {}) => {
      const mergedContext = { ...initialContext, ...context };
      return space.enter(type, mergedContext);
    },
    [initialContext]
  );

  const leave = useCallback(
    async (flowId: string) => {
      await space.leave(flowId);
    },
    []
  );

  // Qualities emerge from the space
  const isReady = metrics.openness > 0.6;
  const isBalanced = metrics.balance > 0.7;
  const isEnergized = metrics.energy > 0.5;

  return {
    metrics,
    flows,
    enter,
    leave,
    isReady,
    isBalanced,
    isEnergized
  };
} 