import { useEffect, useState, useCallback, useMemo } from 'react';
import { NaturalSystem, SystemState } from '../core/system/NaturalSystem';
import { Pattern } from '../core/patterns/PatternRecognition';

interface UseNaturalSystem {
  systemState: SystemState;
  quality: number;
  protection: boolean;
  metrics: {
    coherence: number;
    stability: number;
  };
  protectFlow: (intensity: number) => void;
  evolvePattern: (patternId: string, metrics: Partial<Pattern['metrics']>) => void;
}

// Singleton instance for system-wide state
const naturalSystem = new NaturalSystem();

export function useNaturalSystem(): UseNaturalSystem {
  // System state
  const [systemState, setSystemState] = useState<SystemState>(
    naturalSystem['systemState$'].value
  );
  
  // Quality metrics
  const [quality, setQuality] = useState<number>(systemState.quality);
  const [protection, setProtection] = useState<boolean>(systemState.protection);
  const [metrics, setMetrics] = useState({
    coherence: systemState.contextMetrics.coherence,
    stability: systemState.contextMetrics.stability
  });

  // Subscribe to system state changes
  useEffect(() => {
    const subscription = naturalSystem.observeSystem().subscribe(setSystemState);
    return () => subscription.unsubscribe();
  }, []);

  // Subscribe to quality changes
  useEffect(() => {
    const subscription = naturalSystem.observeQuality().subscribe(setQuality);
    return () => subscription.unsubscribe();
  }, []);

  // Subscribe to protection changes
  useEffect(() => {
    const subscription = naturalSystem.observeProtection().subscribe(setProtection);
    return () => subscription.unsubscribe();
  }, []);

  // Subscribe to metrics changes
  useEffect(() => {
    const subscription = naturalSystem.getSystemMetrics().subscribe(metrics => {
      setMetrics({
        coherence: metrics.coherence,
        stability: metrics.stability
      });
    });
    return () => subscription.unsubscribe();
  }, []);

  // System control callbacks
  const protectFlow = useCallback((intensity: number) => {
    naturalSystem.protectFlow(intensity);
  }, []);

  const evolvePattern = useCallback((
    patternId: string,
    metrics: Partial<Pattern['metrics']>
  ) => {
    naturalSystem.evolvePattern(patternId, metrics);
  }, []);

  // Memoized return value
  return useMemo(
    () => ({
      systemState,
      quality,
      protection,
      metrics,
      protectFlow,
      evolvePattern
    }),
    [systemState, quality, protection, metrics]
  );
} 