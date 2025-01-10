import { useEffect, useState, useMemo } from 'react';
import { useEnergySystem } from './useEnergySystem';

interface EnergyAnalytics {
  averageFlowDuration: number;
  peakFlowFrequency: number;
  entropyTrend: number;
  flowEfficiency: number;
  protectionRate: number;
  sessionMetrics: {
    totalSessions: number;
    averageQuality: number;
    averageIntensity: number;
    protectedSessions: number;
  };
}

export function useEnergyAnalytics(): EnergyAnalytics {
  const energySystem = useEnergySystem();
  const [analytics, setAnalytics] = useState<EnergyAnalytics>({
    averageFlowDuration: 0,
    peakFlowFrequency: 0,
    entropyTrend: 0,
    flowEfficiency: 0,
    protectionRate: 0,
    sessionMetrics: {
      totalSessions: 0,
      averageQuality: 0,
      averageIntensity: 0,
      protectedSessions: 0
    }
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

  const qualityScore = useMemo(() => {
    const { averageQuality, averageIntensity } = analytics.sessionMetrics;
    return (averageQuality + averageIntensity) / 2;
  }, [analytics.sessionMetrics]);

  const protectionEfficiency = useMemo(() => {
    const { protectedSessions, totalSessions } = analytics.sessionMetrics;
    return totalSessions > 0 ? protectedSessions / totalSessions : 0;
  }, [analytics.sessionMetrics]);

  return {
    ...analytics,
    flowEfficiency,
    protectionRate,
    sessionMetrics: {
      ...analytics.sessionMetrics,
      qualityScore,
      protectionEfficiency
    }
  };
} 