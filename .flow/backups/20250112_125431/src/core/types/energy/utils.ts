import { useEffect, useState, useMemo } from 'react';
import { useEnergySystem } from './useEnergySystem';

interface EnergyAnalytics {
  averageFlowDuration: number;
  peakFlowFrequency: number;
  entropyTrend: number;
  flowEfficiency: number;
  protectionRate: number;
}

export function useEnergyAnalytics(): EnergyAnalytics {
  const energySystem = useEnergySystem();
  const [analytics, setAnalytics] = useState<EnergyAnalytics>({
    averageFlowDuration: 0,
    peakFlowFrequency: 0,
    entropyTrend: 0,
    flowEfficiency: 0,
    protectionRate: 0
  });

  useEffect(() => {
    const subscription = energySystem.getFlowAnalytics().subscribe(
      (newAnalytics: EnergyAnalytics) => {
        setAnalytics(prev => ({
          ...prev,
          ...newAnalytics
        }));
      }
    );

    return () => subscription.unsubscribe();
  }, [energySystem]);

  const flowEfficiency = useMemo(() => {
    return analytics.averageFlowDuration * (1 - analytics.entropyTrend);
  }, [analytics.averageFlowDuration, analytics.entropyTrend]);

  const protectionRate = useMemo(() => {
    return analytics.peakFlowFrequency / 24; // Protection rate per hour
  }, [analytics.peakFlowFrequency]);

  return {
    ...analytics,
    flowEfficiency,
    protectionRate
  };
}
