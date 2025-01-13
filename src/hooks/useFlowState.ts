import { useState, useEffect } from 'react';
import { BehaviorSubject } from 'rxjs';
import { FlowState, FlowMetrics, EnergyType } from '../core/types/base';

const flowState$ = new BehaviorSubject<FlowState>(FlowState.FOCUS);
const metrics$ = new BehaviorSubject<FlowMetrics>({
  focus: 0,
  productivity: 0,
  timeInState: 0,
  energyLevel: 100,
  flowState: FlowState.FOCUS,
  energyType: EnergyType.MENTAL
});

export function useFlowState() {
  const [currentState, setCurrentState] = useState<FlowState>(FlowState.FOCUS);
  const [metrics, setMetrics] = useState<FlowMetrics>(metrics$.value);
  const [isProtected, setIsProtected] = useState(false);

  useEffect(() => {
    const subscription = flowState$.subscribe(setCurrentState);
    return () => subscription.unsubscribe();
  }, []);

  const updateState = (newState: FlowState) => {
    flowState$.next(newState);
  };

  const updateMetrics = (newMetrics: Partial<FlowMetrics>) => {
    metrics$.next({ ...metrics$.value, ...newMetrics });
  };

  return { currentState, metrics, isProtected, updateState, updateMetrics };
}