import { useEffect, useState, useCallback } from 'react';
import { FlowSpace, SpaceMetrics } from './FlowSpace';
import { FlowPattern, FlowType, FlowContext } from './FlowEngine';

interface UseFlowResult {
  // Space state
  metrics: SpaceMetrics;
  flows: FlowPattern[];
  
  // Natural actions
  enter: (type: FlowType, context?: FlowContext) => Promise<FlowPattern>;
  leave: (flowId: string) => Promise<void>;
  
  // Space status
  isActive: boolean;
  isDeep: boolean;
  isHarmonious: boolean;
}

// Global space instance that naturally persists
const globalSpace = new FlowSpace();

export function useFlow(
  initialContext: FlowContext = {}
): UseFlowResult {
  // Track natural state
  const [metrics, setMetrics] = useState<SpaceMetrics>({
    depth: 0.1,
    harmony: 0.5,
    activity: 0.1
  });
  const [flows, setFlows] = useState<FlowPattern[]>([]);

  // Observe space naturally
  useEffect(() => {
    const subscription = globalSpace.observe().subscribe(
      ({ metrics: newMetrics, flows: newFlows }) => {
        setMetrics(newMetrics);
        setFlows(newFlows);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Natural flow actions
  const enter = useCallback(
    async (type: FlowType, context: FlowContext = {}) => {
      const mergedContext = { ...initialContext, ...context };
      return globalSpace.enter(type, mergedContext);
    },
    [initialContext]
  );

  const leave = useCallback(
    async (flowId: string) => {
      await globalSpace.leave(flowId);
    },
    []
  );

  // Derived natural states
  const isActive = metrics.activity > 0.5;
  const isDeep = metrics.depth > 0.7;
  const isHarmonious = metrics.harmony > 0.6;

  return {
    // Core state
    metrics,
    flows,
    
    // Actions
    enter,
    leave,
    
    // Natural indicators
    isActive,
    isDeep,
    isHarmonious
  };
} 