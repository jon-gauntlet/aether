import { useState, useCallback } from 'react';
import type { FlowState } from '../types/base';
import type { Energy, EnergyMetrics } from '../energy/types';
import type { EnergyPattern, PatternState } from '../pattern/types';
import { PatternSystem } from '../pattern/PatternSystem';

export function usePattern() {
  const [patternSystem] = useState(() => new PatternSystem());
  const [activePatterns, setActivePatterns] = useState<Array<{
    id: string;
    state: PatternState;
    confidence: number;
  }>>([]);

  const addPattern = useCallback((pattern: EnergyPattern) => {
    patternSystem.addPattern({
      id: pattern.id,
      name: pattern.name,
      conditions: {
        flowState: pattern.flowState,
        minFieldStrength: pattern.energyLevels.mental + pattern.energyLevels.physical + pattern.energyLevels.emotional,
        minResonance: pattern.metrics.efficiency
      },
      weight: pattern.evolution.version,
      activations: 0
    });
    
    setActivePatterns(prev => [...prev, { 
      id: pattern.id,
      state: pattern.state,
      confidence: 1
    }]);
  }, [patternSystem]);

  const removePattern = useCallback((id: string) => {
    patternSystem.removePattern(id);
    setActivePatterns(prev => prev.filter(p => p.id !== id));
  }, [patternSystem]);

  const updatePattern = useCallback((pattern: EnergyPattern) => {
    patternSystem.updatePattern({
      id: pattern.id,
      name: pattern.name,
      conditions: {
        flowState: pattern.flowState,
        minFieldStrength: pattern.energyLevels.mental + pattern.energyLevels.physical + pattern.energyLevels.emotional,
        minResonance: pattern.metrics.efficiency
      },
      weight: pattern.evolution.version,
      activations: 0
    });
  }, [patternSystem]);

  return {
    activePatterns,
    addPattern,
    removePattern,
    updatePattern
  };
} 