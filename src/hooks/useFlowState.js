import { useState, useEffect } from 'react';
import { BehaviorSubject } from 'rxjs';
import { FlowState, FlowMetrics, EnergyType } from '../core/types/base';

const flowState$ = new BehaviorSubject<FlowState>(FlowState.FOCUS);
const metrics$ = new BehaviorSubject<FlowMetrics>({
  energy: EnergyType.HIGH,
  focus: 100,
  momentum: 100,
  protection: true
});

export function useFlowState() {
  const [currentState, setCurrentState] = useState<FlowState>(flowState$.value);
  const [metrics, setMetrics] = useState<FlowMetrics>(metrics$.value);
  const [isProtected, setIsProtected] = useState(true);

  useEffect(() => {
    const stateSubscription = flowState$.subscribe(setCurrentState);
    const metricsSubscription = metrics$.subscribe(setMetrics);

    return () => {
      stateSubscription.unsubscribe();
      metricsSubscription.unsubscribe();
    };
  }, []);

  const updateState = (newState: FlowState) => {
    flowState$.next(newState);
  };

  const updateMetrics = (newMetrics: Partial<FlowMetrics>) => {
    metrics$.next({
      ...metrics$.value,
      ...newMetrics
    });
  };

  return {
    currentState,
    metrics,
    isProtected,
    updateState,
    updateMetrics
  };
} 