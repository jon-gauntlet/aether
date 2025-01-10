import { useCallback, useEffect, useMemo } from 'react';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { Field, Resonance, Protection, FlowMetrics } from '../types/base';

interface FieldState {
  field: Field;
  isActive: boolean;
  isResonating: boolean;
  isProtected: boolean;
}

const fieldState$ = new BehaviorSubject<FieldState>({
  field: null,
  isActive: false,
  isResonating: false,
  isProtected: false
});

export const useField = (initialField: Field) => {
  const updateFieldState = useCallback((field: Field) => {
    const currentState = fieldState$.getValue();
    fieldState$.next({
      ...currentState,
      field,
      isActive: field.strength > 0.5,
      isResonating: field.resonance.amplitude > 0.7,
      isProtected: field.protection.shields > 0.8
    });
  }, []);

  const fieldObservable = useMemo(() => 
    new BehaviorSubject<Field>(initialField).pipe(
      map(field => ({
        ...field,
        resonance: calculateResonance(field.resonance),
        protection: calculateProtection(field.protection),
        flowMetrics: calculateFlowMetrics(field.flowMetrics)
      })),
      distinctUntilChanged(),
      debounceTime(100)
    ), [initialField]);

  useEffect(() => {
    const subscription = fieldObservable.subscribe(updateFieldState);
    return () => subscription.unsubscribe();
  }, [fieldObservable, updateFieldState]);

  const amplifyField = useCallback(() => {
    const { field } = fieldState$.getValue();
    updateFieldState({
      ...field,
      strength: Math.min(field.strength * 1.1, 1),
      resonance: {
        ...field.resonance,
        amplitude: Math.min(field.resonance.amplitude * 1.05, 1)
      }
    });
  }, [updateFieldState]);

  const dampField = useCallback(() => {
    const { field } = fieldState$.getValue();
    updateFieldState({
      ...field,
      strength: Math.max(field.strength * 0.9, 0),
      resonance: {
        ...field.resonance,
        amplitude: Math.max(field.resonance.amplitude * 0.95, 0)
      }
    });
  }, [updateFieldState]);

  return {
    fieldState: fieldState$.getValue(),
    amplifyField,
    dampField,
    updateFieldState
  };
};

const calculateResonance = (resonance: Resonance): Resonance => ({
  ...resonance,
  harmonics: resonance.harmonics.map(h => h * resonance.amplitude)
});

const calculateProtection = (protection: Protection): Protection => ({
  ...protection,
  shields: protection.shields * protection.resilience,
  recovery: protection.recovery * protection.adaptability
});

const calculateFlowMetrics = (metrics: FlowMetrics): FlowMetrics => ({
  ...metrics,
  velocity: metrics.velocity * (1 - metrics.resistance),
  momentum: metrics.momentum * metrics.conductivity
}); 