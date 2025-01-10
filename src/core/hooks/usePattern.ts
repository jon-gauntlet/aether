import { useState, useCallback } from 'react';
import { FlowState } from '../types/base';
import { Energy, EnergyMetrics } from '../energy/types';
import { EnergyPattern, PatternState, PatternContext } from '../pattern/types';
import { PatternSystem } from '../pattern/PatternSystem';

export const usePattern = () => {
  const [activePattern, setActivePattern] = useState<EnergyPattern | null>(null);
  const [patternSystem] = useState(() => new PatternSystem());

  const createPattern = useCallback((
    flowState: FlowState,
    energy: Energy,
    metrics: EnergyMetrics,
    context?: Partial<PatternContext>
  ) => {
    const pattern = patternSystem.createPattern(flowState, energy, metrics, context);
    setActivePattern(pattern);
    return pattern;
  }, [patternSystem]);

  const findMatchingPattern = useCallback((
    flowState: FlowState,
    energy: Energy,
    context?: Partial<PatternContext>
  ) => {
    const match = patternSystem.findMatchingPattern(flowState, energy, context);
    if (match && match.confidence > 0.8) {
      setActivePattern(match.pattern);
    }
    return match;
  }, [patternSystem]);

  const evolvePattern = useCallback((
    pattern: EnergyPattern,
    context: {
      energyLevels: Energy;
      metrics: EnergyMetrics;
    },
    wasSuccessful: boolean
  ) => {
    const evolvedPattern = patternSystem.evolvePattern(pattern, context, wasSuccessful);
    
    if (activePattern?.id === pattern.id) {
      setActivePattern(evolvedPattern);
    }
    
    return evolvedPattern;
  }, [patternSystem, activePattern]);

  const clearActivePattern = useCallback(() => {
    setActivePattern(null);
  }, []);

  return {
    activePattern,
    createPattern,
    findMatchingPattern,
    evolvePattern,
    clearActivePattern
  };
}; 