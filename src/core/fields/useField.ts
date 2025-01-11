import { useCallback, useEffect, useMemo } from 'react';
import { BehaviorSubject } from 'rxjs';
import { map, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { IField, IResonance } from '../types/base';

interface IFieldState {
  field: IField | null;
  isActive: boolean;
  isResonating: boolean;
  isProtected: boolean;
}

interface IProtection {
  shields: number;
  level: number;
  type: string;
}

const fieldState$ = new BehaviorSubject<IFieldState>({
  field: null,
  isActive: false,
  isResonating: false,
  isProtected: false
});

export const useField = (initialField: IField) => {
  const updateFieldState = useCallback((field: IField) => {
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
    new BehaviorSubject<IField>(initialField).pipe(
      map((field: IField) => ({
        ...field,
        resonance: calculateResonance(field.resonance),
        protection: calculateProtection(field.protection)
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
      strength: Math.min(1, field.strength + 0.1),
      resonance: {
        ...field.resonance,
        amplitude: Math.min(1, field.resonance.amplitude + 0.1)
      }
    });
  }, []);

  const calculateResonance = (resonance: IResonance): IResonance => ({
    ...resonance,
    amplitude: Math.min(1, resonance.amplitude + 0.05),
    coherence: Math.min(1, resonance.coherence + 0.05)
  });

  const calculateProtection = (protection: IProtection): IProtection => ({
    ...protection,
    shields: Math.min(1, protection.shields + 0.05)
  });

  return {
    fieldState: fieldState$.getValue(),
    amplifyField,
    updateFieldState
  };
}; 