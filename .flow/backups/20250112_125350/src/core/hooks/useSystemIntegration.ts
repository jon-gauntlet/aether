import { useState, useCallback, useEffect } from 'react';
import { BehaviorSubject, Observable } from 'rxjs';
import type { Field, FlowState } from '../types/base';
import type { ConsciousnessState } from '../types/consciousness';
import type { Energy, EnergyMetrics } from '../energy/types';
import { SystemIntegration } from '../integration/SystemIntegration';

export function useSystemIntegration() {
  const [integration] = useState(() => new SystemIntegration({
    observeFlow: () => new BehaviorSubject<FlowState>('RESTING'),
    observeEnergy: () => new BehaviorSubject({ level: 1, quality: 1, stability: 1, protection: 1 }),
    observeSpaces: () => new BehaviorSubject([]),
    updateSpace: () => {},
    updateFlow: () => {},
    updateEnergy: () => {}
  }));

  const [state, setState] = useState<ConsciousnessState | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const subscription = integration.observeSystemState().subscribe({
      next: (newState) => setState(newState),
      error: (err) => setError(err)
    });

    const errorSubscription = integration.observeErrors().subscribe({
      next: (err) => setError(err)
    });

    return () => {
      subscription.unsubscribe();
      errorSubscription.unsubscribe();
    };
  }, [integration]);

  const evolveSystemState = useCallback(async (targetState: Partial<ConsciousnessState>) => {
    if (!state) return;
    await integration.evolveSystemState(state, targetState);
  }, [integration, state]);

  return {
    state,
    error,
    evolveSystemState
  };
} 