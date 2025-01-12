import { useCallback, useEffect, useMemo } from 'react';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { Field, Resonance, Protection, FlowMetrics, ResonanceWave } from '../base';

interface FieldState {
  field: Field | null;
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
      isActive: field.metrics.energy > 0.5,
      isResonating: field.metrics.flow > 0.7,
      isProtected: field.protection.stability > 0.8
    });
  }, []);

  const fieldObservable = useMemo(() => 
    new BehaviorSubject<Field>(initialField).pipe(
      map(field => ({
        ...field,
        metrics: {
          ...field.metrics,
          flow: calculateFlow(field),
          coherence: calculateCoherence(field)
        },
        protection: {
          ...field.protection,
          stability: calculateStability(field)
        }
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
    if (!field) return;
    
    updateFieldState({
      ...field,
      metrics: {
        ...field.metrics,
        energy: Math.min(field.metrics.energy * 1.1, 1),
        flow: Math.min(field.metrics.flow * 1.05, 1)
      }
    });
  }, [updateFieldState]);

  const dampField = useCallback(() => {
    const { field } = fieldState$.getValue();
    if (!field) return;
    
    updateFieldState({
      ...field,
      metrics: {
        ...field.metrics,
        energy: Math.max(field.metrics.energy * 0.9, 0),
        flow: Math.max(field.metrics.flow * 0.95, 0)
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

const calculateFlow = (field: Field): number => {
  return field.metrics.energy * (1 - field.protection.integrity);
};

const calculateCoherence = (field: Field): number => {
  return field.metrics.flow * field.protection.stability;
};

const calculateStability = (field: Field): number => {
  return field.protection.adaptability * field.metrics.coherence;
};