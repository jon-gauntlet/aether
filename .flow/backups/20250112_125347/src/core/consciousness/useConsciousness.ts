import { useCallback, useEffect, useMemo } from 'react';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { Field, FlowState } from '../types/base';
import { ConsciousnessState, FlowSpace, ConsciousnessMetrics, createDefaultConsciousnessState } from '../types/consciousness';

interface ConsciousnessHookState {
  consciousness: ConsciousnessState;
  isCoherent: boolean;
  isIntegrated: boolean;
  isFlexible: boolean;
}

const consciousnessState$ = new BehaviorSubject<ConsciousnessHookState>({
  consciousness: createDefaultConsciousnessState(),
  isCoherent: false,
  isIntegrated: false,
  isFlexible: false
});

export const useConsciousness = (fields: Field[]) => {
  const updateConsciousnessState = useCallback((consciousness: ConsciousnessState) => {
    const currentState = consciousnessState$.getValue();
    consciousnessState$.next({
      ...currentState,
      consciousness,
      isCoherent: consciousness.metrics.coherence > 0.7,
      isIntegrated: consciousness.metrics.integration > 0.7,
      isFlexible: consciousness.metrics.flexibility > 0.7
    });
  }, []);

  const consciousnessObservable = useMemo(() => 
    new BehaviorSubject<Field[]>(fields).pipe(
      map(fields => ({
        ...createDefaultConsciousnessState(),
        fields,
        flowSpace: calculateFlowSpace(fields),
        metrics: calculateMetrics(fields)
      })),
      distinctUntilChanged(),
      debounceTime(100)
    ), [fields]);

  useEffect(() => {
    const subscription = consciousnessObservable.subscribe(updateConsciousnessState);
    return () => subscription.unsubscribe();
  }, [consciousnessObservable, updateConsciousnessState]);

  const expandConsciousness = useCallback(() => {
    const { consciousness } = consciousnessState$.getValue();
    updateConsciousnessState({
      ...consciousness,
      flowSpace: {
        ...consciousness.flowSpace,
        capacity: consciousness.flowSpace.capacity * 1.1,
        stability: Math.min(consciousness.flowSpace.stability * 1.05, 1)
      },
      metrics: {
        ...consciousness.metrics,
        depth: Math.min(consciousness.metrics.depth * 1.1, 1),
        clarity: Math.min(consciousness.metrics.clarity * 1.05, 1)
      }
    });
  }, [updateConsciousnessState]);

  const contractConsciousness = useCallback(() => {
    const { consciousness } = consciousnessState$.getValue();
    updateConsciousnessState({
      ...consciousness,
      flowSpace: {
        ...consciousness.flowSpace,
        capacity: consciousness.flowSpace.capacity * 0.9,
        stability: Math.max(consciousness.flowSpace.stability * 0.95, 0)
      },
      metrics: {
        ...consciousness.metrics,
        depth: Math.max(consciousness.metrics.depth * 0.9, 0),
        clarity: Math.max(consciousness.metrics.clarity * 0.95, 0)
      }
    });
  }, [updateConsciousnessState]);

  return {
    consciousnessState: consciousnessState$.getValue(),
    expandConsciousness,
    contractConsciousness,
    updateConsciousnessState
  };
};

const calculateFlowSpace = (fields: Field[]): FlowSpace => {
  const totalStrength = fields.reduce((sum, field) => sum + field.strength, 0);
  return {
    dimensions: Math.max(3, Math.floor(Math.sqrt(fields.length))),
    capacity: 100 * (1 + totalStrength / fields.length),
    utilization: fields.length / 10,
    stability: Math.min(1, 1 / Math.log(fields.length + 1)),
    fields,
    boundaries: []
  };
};

const calculateMetrics = (fields: Field[]): ConsciousnessMetrics => {
  const totalResonance = fields.reduce((sum, field) => sum + field.resonance.amplitude, 0);
  const averageProtection = fields.reduce((sum, field) => sum + field.protection.shields, 0) / fields.length;
  
  return {
    clarity: Math.min(1, 1 / Math.log(fields.length + 1)),
    depth: Math.min(1, totalResonance / fields.length),
    coherence: Math.min(1, averageProtection),
    integration: Math.min(1, fields.length / 10),
    flexibility: Math.min(1, 1 / fields.length)
  };
}; 