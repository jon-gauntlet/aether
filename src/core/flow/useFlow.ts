import { useCallback, useEffect, useMemo } from 'react';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { Field, FlowState, FlowMetrics } from '../types/base';
import { ConsciousnessState, FlowSpace } from '../types/consciousness';

interface FlowHookState {
  field: Field;
  consciousness: ConsciousnessState;
  flowMetrics: FlowMetrics;
  isInFlow: boolean;
}

const flowState$ = new BehaviorSubject<FlowHookState>({
  field: null,
  consciousness: null,
  flowMetrics: null,
  isInFlow: false
});

export const useFlow = (field: Field, consciousness: ConsciousnessState) => {
  const updateFlowState = useCallback((metrics: FlowMetrics) => {
    const currentState = flowState$.getValue();
    flowState$.next({
      ...currentState,
      field,
      consciousness,
      flowMetrics: metrics,
      isInFlow: metrics.velocity > 0.7 && metrics.resistance < 0.3
    });
  }, [field, consciousness]);

  const flowObservable = useMemo(() => 
    combineLatest([
      new Observable<Field>((subscriber) => subscriber.next(field)),
      new Observable<ConsciousnessState>((subscriber) => subscriber.next(consciousness))
    ]).pipe(
      map(([f, c]) => ({
        velocity: f.flowMetrics.velocity * c.flowSpace.stability,
        momentum: f.flowMetrics.momentum * (1 + c.metrics.depth),
        resistance: f.flowMetrics.resistance / c.metrics.clarity,
        conductivity: f.flowMetrics.conductivity * c.metrics.integration
      })),
      distinctUntilChanged(),
      debounceTime(100)
    ), [field, consciousness]);

  useEffect(() => {
    const subscription = flowObservable.subscribe(updateFlowState);
    return () => subscription.unsubscribe();
  }, [flowObservable, updateFlowState]);

  const enhanceFlow = useCallback(() => {
    const { flowMetrics } = flowState$.getValue();
    updateFlowState({
      ...flowMetrics,
      velocity: Math.min(flowMetrics.velocity * 1.1, 1),
      momentum: Math.min(flowMetrics.momentum * 1.05, 1),
      resistance: Math.max(flowMetrics.resistance * 0.95, 0),
      conductivity: Math.min(flowMetrics.conductivity * 1.02, 1)
    });
  }, [updateFlowState]);

  const disruptFlow = useCallback(() => {
    const { flowMetrics } = flowState$.getValue();
    updateFlowState({
      ...flowMetrics,
      velocity: Math.max(flowMetrics.velocity * 0.9, 0),
      momentum: Math.max(flowMetrics.momentum * 0.95, 0),
      resistance: Math.min(flowMetrics.resistance * 1.05, 1),
      conductivity: Math.max(flowMetrics.conductivity * 0.98, 0)
    });
  }, [updateFlowState]);

  return {
    flowState: flowState$.getValue(),
    enhanceFlow,
    disruptFlow,
    updateFlowState
  };
}; 