import { useEffect, useState } from 'react';
import { useEnergySystem } from './useEnergySystem';

interface EnergyAnalytics {
  averageFlowDuration: number;
  peakFlowFrequency: number;
  entropyTrend: number;
}

export function useEnergyAnalytics(): EnergyAnalytics {
  const energySystem = useEnergySystem();
  const [analytics, setAnalytics] = useState<EnergyAnalytics>({
    averageFlowDuration: 0,
    peakFlowFrequency: 0,
    entropyTrend: 0
  });

  useEffect(() => {
    const subscription = energySystem.getFlowAnalytics().subscribe(
      (newAnalytics) => {
        setAnalytics(newAnalytics);
      }
    );

    return () => subscription.unsubscribe();
  }, [energySystem]);

  return analytics;
