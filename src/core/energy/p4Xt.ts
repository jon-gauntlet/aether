import { useEffect, useState, useMemo } from 'react';
import { useEnergySystem } from '.';
import { SessionMetrics } from '../types/flow';
import { PatternAnalytics } from '../types/patterns';

interface SystemMetrics {
  totalPatterns: number;
  activePatterns: number;
  averageStrength: number;
  averageEntropy: number;
  evolutionRate: number;
  patternSynergy: number;
}

interface PatternInsight {
  type: 'success' | 'warning' | 'info';
  message: string;
  patterns?: string[];
}

interface EnergyAnalytics {
  averageFlowDuration: number;
  peakFlowFrequency: number;
  entropyTrend: number;
  flowEfficiency: number;
  protectionRate: number;
  sessionMetrics: SessionMetrics;
  patternAnalytics: {
    patterns: {
      id: string;
      name: string;
      analytics: PatternAnalytics;
    }[];
    systemMetrics: SystemMetrics;
    insights: PatternInsight[];
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
      protectedSessions: 0,
      qualityScore: 0,
      protectionEfficiency: 0
    },
    patternAnalytics: {
      patterns: [],
      systemMetrics: {
        totalPatterns: 0,
        activePatterns: 0,
        averageStrength: 0,
        averageEntropy: 0,
        evolutionRate: 0,
        patternSynergy: 0
      },
      insights: []
    }
  });

  useEffect(() => {
    const flowSubscription = energySystem.getFlowAnalytics().subscribe(
      (newAnalytics: Omit<EnergyAnalytics, 'patternAnalytics'>) => {
        setAnalytics(prev => ({
          ...prev,
          ...newAnalytics
        }));
      }
    );

    const patternSubscription = energySystem.getPatternAnalytics().subscribe(
      (patternAnalytics: {
        patterns: {
          id: string;
          name: string;
          analytics: PatternAnalytics;
        }[];
        systemMetrics: SystemMetrics;
        insights: PatternInsight[];
      }) => {
        setAnalytics(prev => ({
          ...prev,
          patternAnalytics
        }));
      }
    );

    return () => {
      flowSubscription.unsubscribe();
      patternSubscription.unsubscribe();
    };
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