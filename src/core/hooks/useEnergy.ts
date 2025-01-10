import { useState, useCallback } from 'react';
import { Energy, EnergyMetrics } from '../energy/types';

export const useEnergy = () => {
  const [energy, setEnergy] = useState<Energy>({
    mental: 0.8,
    physical: 0.8,
    emotional: 0.8
  });

  const [metrics, setMetrics] = useState<EnergyMetrics>({
    efficiency: 0.8,
    sustainability: 0.8,
    recovery: 0.8
  });

  const [flowEfficiency, setFlowEfficiency] = useState(0.8);

  const updateEnergy = useCallback((updates: Partial<Energy>) => {
    setEnergy(prev => {
      const next = { ...prev, ...updates };
      const avgEnergy = (next.mental + next.physical + next.emotional) / 3;
      
      setFlowEfficiency(prev => {
        const newEfficiency = avgEnergy * metrics.efficiency;
        return Math.max(0, Math.min(1, newEfficiency));
      });

      return next;
    });
  }, [metrics.efficiency]);

  const updateMetrics = useCallback((updates: Partial<EnergyMetrics>) => {
    setMetrics(prev => {
      const next = { ...prev, ...updates };
      setFlowEfficiency(prev => {
        const avgEnergy = (energy.mental + energy.physical + energy.emotional) / 3;
        const newEfficiency = avgEnergy * next.efficiency;
        return Math.max(0, Math.min(1, newEfficiency));
      });
      return next;
    });
  }, [energy]);

  const recover = useCallback((rate: number = 0.1) => {
    const recoveryRate = rate * metrics.recovery;
    updateEnergy({
      mental: Math.min(1, energy.mental + recoveryRate),
      physical: Math.min(1, energy.physical + recoveryRate),
      emotional: Math.min(1, energy.emotional + recoveryRate)
    });
  }, [energy, metrics.recovery, updateEnergy]);

  const deplete = useCallback((rate: number = 0.1) => {
    const depletionRate = rate * (1 - metrics.sustainability);
    updateEnergy({
      mental: Math.max(0, energy.mental - depletionRate),
      physical: Math.max(0, energy.physical - depletionRate),
      emotional: Math.max(0, energy.emotional - depletionRate)
    });
  }, [energy, metrics.sustainability, updateEnergy]);

  return {
    energy,
    metrics,
    flowEfficiency,
    updateEnergy,
    updateMetrics,
    recover,
    deplete
  };
}; 