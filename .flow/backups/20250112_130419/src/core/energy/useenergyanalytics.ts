import { useEffect, useMemo } from 'react';
import { useEnergySystem } from './useenergysystem';
import { SessionMetrics } from '../types/flow/metrics';
import { FlowStateType } from '../types/flow/types';
import { FlowTransition } from '../types/flow/types';
import { ProtectionState } from '../types/protection/protection';

export interface EnergyAnalytics {
  sessionMetrics: SessionMetrics;
  updateMetrics: () => void;
}

interface TransitionCounts {
  toFlow: number;
  toHyperfocus: number;
  toRecovery: number;
  toExhaustion: number;
}

export const useEnergyAnalytics = (): EnergyAnalytics => {
  const { flowState, transitions, protection } = useEnergySystem();

  const sessionMetrics = useMemo<SessionMetrics>(() => {
    if (!flowState || transitions.length === 0) {
      return {
        averageFlowDuration: 0,
        peakFlowFrequency: 0,
        entropyTrend: 0,
        flowEfficiency: 0,
        protectionRate: 0,
        recoverySpeed: 0,
        stateTransitions: {
          toFlow: 0,
          toHyperfocus: 0,
          toRecovery: 0,
          toExhaustion: 0
        }
      };
    }

    // Calculate metrics
    const flowDurations = transitions
      .filter((t: FlowTransition) => t.to.type === FlowStateType.FLOW || t.to.type === FlowStateType.HYPERFOCUS)
      .map((t: FlowTransition) => t.duration);

    const avgDuration = flowDurations.length > 0 
      ? flowDurations.reduce((sum: number, d: number) => sum + d, 0) / flowDurations.length
      : 0;

    const peakStates = transitions.filter((t: FlowTransition) => t.to.type === FlowStateType.HYPERFOCUS);
    const peakFreq = transitions.length > 0 ? peakStates.length / transitions.length : 0;

    // Count state transitions
    const stateTransitions = transitions.reduce((counts: TransitionCounts, t: FlowTransition) => {
      switch (t.to.type) {
        case FlowStateType.FLOW:
          counts.toFlow++;
          break;
        case FlowStateType.HYPERFOCUS:
          counts.toHyperfocus++;
          break;
        case FlowStateType.RECOVERING:
          counts.toRecovery++;
          break;
        case FlowStateType.EXHAUSTED:
          counts.toExhaustion++;
          break;
      }
      return counts;
    }, {
      toFlow: 0,
      toHyperfocus: 0,
      toRecovery: 0,
      toExhaustion: 0
    });

    // Calculate protection rate
    const protectionRate = protection ? protection.strength * protection.resilience : 0;

    // Calculate recovery speed (inverse of average recovery duration)
    const recoveryDurations = transitions
      .filter((t: FlowTransition) => t.to.type === FlowStateType.RECOVERING)
      .map((t: FlowTransition) => t.duration);
    
    const avgRecoveryTime = recoveryDurations.length > 0
      ? recoveryDurations.reduce((sum: number, d: number) => sum + d, 0) / recoveryDurations.length
      : 0;

    const recoverySpeed = avgRecoveryTime > 0 ? 1 / avgRecoveryTime : 0;

    // Calculate flow efficiency
    const totalFlowTime = flowDurations.reduce((sum: number, d: number) => sum + d, 0);
    const totalTime = transitions.reduce((sum: number, t: FlowTransition) => sum + t.duration, 0);
    const efficiency = totalTime > 0 ? totalFlowTime / totalTime : 0;

    // Estimate entropy trend based on transition patterns
    const entropyTrend = 1 - (efficiency * protectionRate);

    return {
      averageFlowDuration: avgDuration,
      peakFlowFrequency: peakFreq,
      entropyTrend,
      flowEfficiency: efficiency,
      protectionRate,
      recoverySpeed,
      stateTransitions
    };
  }, [flowState, transitions, protection]);

  const updateMetrics = () => {
    // Metrics are automatically updated through the useMemo hook
    // This is a no-op function to maintain interface compatibility
  };

  return {
    sessionMetrics,
    updateMetrics
  };
}; 