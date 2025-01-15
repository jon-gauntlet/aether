import { useState, useEffect } from 'react';

/**
 * Hook for managing flow pattern learning
 * @param {Object} flowState Current flow state
 * @returns {Object} Pattern learning state and controls
 */
export const useFlowPattern = (flowState) => {
  const [isLearning, setIsLearning] = useState(false);
  const [activePattern, setActivePattern] = useState(null);

  useEffect(() => {
    // Reset learning state when flow state changes
    setIsLearning(false);
    setActivePattern(null);
  }, [flowState]);

  const learnCurrentState = (energyLevels, metrics) => {
    setIsLearning(true);
    setActivePattern({
      energyLevels,
      metrics,
      state: 'evolving',
      confidence: 0
    });
  };

  const evolvePattern = (newMetrics) => {
    if (!activePattern) return;

    setActivePattern(prev => ({
      ...prev,
      metrics: { ...prev.metrics, ...newMetrics },
      confidence: Math.min((prev.confidence || 0) + 0.1, 1)
    }));
  };

  const resetLearning = () => {
    setIsLearning(false);
    setActivePattern(null);
  };

  return {
    isLearning,
    activePattern,
    learnCurrentState,
    evolvePattern,
    resetLearning
  };
}; 