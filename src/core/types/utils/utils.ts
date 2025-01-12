import { useState } from 'react';
import type { FlowMetrics } from '../base';
import type { ContextState, DevelopmentContext } from '../context';
import type { EnergyState, EnergyMetrics } from '../energy';
import { PredictiveValidation } from '../../autonomic/PredictiveValidation';

interface ValidationState {
  errors: any[];
  isValid: boolean;
}

export function useValidation() {
  const [validation] = useState(() => new PredictiveValidation());
  const [state, setState] = useState<ValidationState>({
    errors: [],
    isValid: true
  });

  const validationSub = validation.observeTypeErrors().subscribe((errors: any[]) => {
    const newErrors = errors.flatMap(e => e.errors);
    setState(prev => ({
      ...prev,
      errors: newErrors,
      isValid: newErrors.length === 0
    }));
  });

  return {
    validation,
    state,
    validationSub
  };
}
