import { useState, useCallback, useEffect } from 'react';
import type { Field } from '../types/base';
import type { Energy } from '../energy/types';

export const useField = (initialField: Field) => {
  const [field, setField] = useState<Field>(initialField);

  const updateField = useCallback((updates: Partial<Field>) => {
    setField(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  const updateMetrics = useCallback((metrics: Partial<Field['metrics']>) => {
    setField(prev => ({
      ...prev,
      metrics: {
        ...prev.metrics,
        ...metrics
      }
    }));
  }, []);

  const updateFlowMetrics = useCallback((flowMetrics: Partial<Field['flowMetrics']>) => {
    setField(prev => ({
      ...prev,
      flowMetrics: {
        ...prev.flowMetrics,
        ...flowMetrics
      }
    }));
  }, []);

  const updateResonance = useCallback((resonance: Partial<Field['resonance']>) => {
    setField(prev => ({
      ...prev,
      resonance: {
        ...prev.resonance,
        ...resonance
      }
    }));
  }, []);

  const updateProtection = useCallback((protection: Partial<Field['protection']>) => {
    setField(prev => ({
      ...prev,
      protection: {
        ...prev.protection,
        ...protection
      }
    }));
  }, []);

  return {
    field,
    updateField,
    updateMetrics,
    updateFlowMetrics,
    updateResonance,
    updateProtection
  };
}; 