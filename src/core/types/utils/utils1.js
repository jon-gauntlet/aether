import { useState } from 'react';
import type { FlowMetrics } from '../base';
import type { AutonomicState } from '../autonomic';

interface ValidationState {
  errors: any[];
  isValid: boolean;
}

export function useValidation() {
  const [state, setState] = useState<ValidationState>({
    errors: [],
    isValid: true
  });

  const validateMetrics = (metrics: FlowMetrics) => {
    const errors: string[] = [];
    const requiredFields = ['velocity', 'resistance', 'momentum', 'conductivity'];

    for (const field of requiredFields) {
      if (!(field in metrics)) {
        errors.push(`Missing required field: ${field}`);
      } else if (typeof metrics[field as keyof FlowMetrics] !== 'number') {
        errors.push(`Field ${field} must be a number`);
      }
    }

    setState(prev => ({
      ...prev,
      errors,
      isValid: errors.length === 0
    }));

    return errors.length === 0;
  };

  return {
    state,
    validateMetrics
  };
}
