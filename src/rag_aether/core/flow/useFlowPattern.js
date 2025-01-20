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
    // Only reset if transitioning out of flow state
    if (flowState.state !== 'flow' && isLearning) {
      setIsLearning(false);
      setActivePattern(null);
    }
  }, [flowState.state, isLearning]);

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