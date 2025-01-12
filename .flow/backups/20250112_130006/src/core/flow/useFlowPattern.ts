import { useCallback, useEffect, useState } from 'react';
import { useFlow } from './useFlow';
import { usePattern } from '../pattern/usePattern';
import { FlowState } from '../types/base';
import { Energy, EnergyMetrics } from '../energy/types';
import { EnergyPattern, PatternMatch } from '../pattern/types';

interface FlowPatternState {
  activePattern: EnergyPattern | null;
  lastMatch: PatternMatch | null;
  isLearning: boolean;
  confidence: number;
}

export const useFlowPattern = () => {
  const {
    currentState,
    metrics: flowMetrics,
    canTransition,
    transitionTo,
    optimize,
    enforceRecovery,
    isEnergyLow
  } = useFlow();

  const {
    createPattern,
    findMatchingPattern,
    evolvePattern,
    protectPattern,
    clearUnstablePatterns
  } = usePattern();

  const [state, setState] = useState<FlowPatternState>({
    activePattern: null,
    lastMatch: null,
    isLearning: false,
    confidence: 0
  });

  // Pattern detection and matching
  const detectPattern = useCallback((
    energy: Energy,
    metrics: EnergyMetrics,
    context: { tags?: string[] } = {}
  ) => {
    const match = findMatchingPattern(currentState, energy, context);
    
    setState(prev => ({
      ...prev,
      lastMatch: match,
      confidence: match?.confidence || 0
    }));

    return match;
  }, [currentState, findMatchingPattern]);

  // Pattern-based flow optimization
  const optimizeWithPattern = useCallback((
    pattern: EnergyPattern,
    energy: Energy,
    metrics: EnergyMetrics
  ) => {
    if (pattern.state === 'PROTECTED' || !canTransition(pattern.flowState)) {
      return false;
    }

    const success = optimize(pattern.flowState);
    
    if (success) {
      evolvePattern(pattern, {
        energyLevels: energy,
        metrics
      }, true);

      setState(prev => ({
        ...prev,
        activePattern: pattern,
        isLearning: true
      }));
    }

    return success;
  }, [canTransition, optimize, evolvePattern]);

  // Learn from current flow state
  const learnCurrentState = useCallback((
    energy: Energy,
    metrics: EnergyMetrics,
    context: { tags?: string[] } = {}
  ) => {
    const { activePattern } = state;

    if (activePattern) {
      evolvePattern(activePattern, {
        energyLevels: energy,
        metrics,
        context: {
          ...activePattern.context,
          ...context
        }
      }, !isEnergyLow());
    } else {
      const newPattern = createPattern(currentState, energy, metrics, context);
      setState(prev => ({
        ...prev,
        activePattern: newPattern,
        isLearning: true
      }));
    }
  }, [state, currentState, isEnergyLow, evolvePattern, createPattern]);

  // Protect successful patterns
  const protectSuccessfulPattern = useCallback((
    pattern: EnergyPattern,
    minSuccessRate = 0.7
  ) => {
    const successRate = pattern.evolution.history
      .filter(h => h.success).length / pattern.evolution.history.length;

    if (successRate >= minSuccessRate) {
      protectPattern(pattern);
      return true;
    }

    return false;
  }, [protectPattern]);

  // Auto-cleanup of unstable patterns
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      if (!state.isLearning) {
        clearUnstablePatterns();
      }
    }, 3600000); // Every hour

    return () => clearInterval(cleanupInterval);
  }, [state.isLearning, clearUnstablePatterns]);

  // Reset learning state when flow state changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      isLearning: false
    }));
  }, [currentState]);

  return {
    ...state,
    detectPattern,
    optimizeWithPattern,
    learnCurrentState,
    protectSuccessfulPattern
  };
}; 