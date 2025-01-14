import { useCallback, useEffect, useState } from 'react';
import { useFlow } from './useFlow';
import { usePattern } from '../pattern/usePattern';

/**
 * @typedef {Object} FlowPatternState
 * @property {import('../pattern/types').EnergyPattern | null} activePattern
 * @property {import('../pattern/types').PatternMatch | null} lastMatch
 * @property {boolean} isLearning
 * @property {number} confidence
 */

/**
 * @typedef {Object} PatternContext
 * @property {string[]} [tags]
 */

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

  /** @type {FlowPatternState} */
  const [state, setState] = useState({
    activePattern: null,
    lastMatch: null,
    isLearning: false,
    confidence: 0
  });

  /**
   * @param {import('../energy/types').Energy} energy
   * @param {import('../energy/types').EnergyMetrics} metrics
   * @param {PatternContext} [context={}]
   * @returns {import('../pattern/types').PatternMatch | null}
   */
  const detectPattern = useCallback((energy, metrics, context = {}) => {
    const match = findMatchingPattern(currentState, energy, context);
    
    setState(prev => ({
      ...prev,
      lastMatch: match,
      confidence: match?.confidence || 0
    }));

    return match;
  }, [currentState, findMatchingPattern]);

  /**
   * @param {import('../pattern/types').EnergyPattern} pattern
   * @param {import('../energy/types').Energy} energy
   * @param {import('../energy/types').EnergyMetrics} metrics
   * @returns {boolean}
   */
  const optimizeWithPattern = useCallback((pattern, energy, metrics) => {
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

  /**
   * @param {import('../energy/types').Energy} energy
   * @param {import('../energy/types').EnergyMetrics} metrics
   * @param {PatternContext} [context={}]
   */
  const learnCurrentState = useCallback((energy, metrics, context = {}) => {
    const { activePattern } = state;

    if (activePattern) {
      evolvePattern(activePattern, {
        energyLevels: energy,
        metrics,
        context: {
          ...activePattern.context,
          ...context
        }
      });
    }
  }, [state, evolvePattern]);

  useEffect(() => {
    if (isEnergyLow) {
      enforceRecovery();
    }
  }, [isEnergyLow, enforceRecovery]);

  return {
    ...state,
    detectPattern,
    optimizeWithPattern,
    learnCurrentState
  };
}; 