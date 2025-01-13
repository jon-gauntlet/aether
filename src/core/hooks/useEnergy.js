import { useState, useCallback } from 'react';
import type { Energy, EnergyMetrics } from '../energy/types';

export const useEnergy = () => {
  const [energy, setEnergy] = useState<Energy>({
    mental: 1,
    physical: 1,
    emotional: 1
  });

  const [metrics, setMetrics] = useState<EnergyMetrics>({
    efficiency: 0.8,
    sustainability: 0.7,
    recovery: 0.9,
    adaptability: 0.8,
    stability: 0.7
  });

  const updateEnergy = useCallback((newEnergy: Partial<Energy>) => {
    setEnergy(prev => ({
      ...prev,
      ...newEnergy
    }));
  }, []);

  const updateMetrics = useCallback((newMetrics: Partial<EnergyMetrics>) => {
    setMetrics(prev => ({
      ...prev,
      ...newMetrics
    }));
  }, []);

  return {
    energy,
    metrics,
    updateEnergy,
    updateMetrics
  };
}; 