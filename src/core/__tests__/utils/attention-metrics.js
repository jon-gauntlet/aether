// Constants
const HOUR_IN_MS = 3600000;
const BLOCKING_THRESHOLD_MS = 300000; // 5 minutes

/**
 * Calculates attention metrics from system state
 */
export const calculateAttentionMetrics = (state) => {
  return {
    focusDepth: state.focus,
    contextClarity: state.context.clarity || 1,
    momentum: calculateMomentum(state),
    energyReserves: state.energy
  };
};

/**
 * Calculates development speed metrics
 */
export const calculateSpeedMetrics = (transitions, timeWindow = HOUR_IN_MS) => {
  const now = Date.now();
  const recentTransitions = transitions.filter(t => now - t.timestamp < timeWindow);
  
  return {
    iterationRate: (recentTransitions.length / timeWindow) * 60000,
    completionRate: estimateCompletionRate(recentTransitions),
    blockingTime: calculateBlockingTime(recentTransitions),
    flowEfficiency: calculateFlowEfficiency(recentTransitions)
  };
};

/**
 * Analyzes attention patterns for optimization opportunities
 */
export const analyzeAttentionPatterns = (metrics, speedMetrics) => {
  const insights = [];
  
  // Check for optimal flow state
  if (metrics.focusDepth > 0.8 && metrics.momentum > 0.8) {
    insights.push('Optimal flow state detected - protect from interruptions');
  }

  // Check for potential context overload
  if (metrics.contextClarity < 0.6) {
    insights.push('Context clarity dropping - consider documenting current state');
  }

  // Check for momentum opportunities
  if (metrics.momentum < 0.6 && metrics.energyReserves > 0.8) {
    insights.push('High energy available - good time to tackle complex tasks');
  }

  // Check development speed patterns
  if (speedMetrics.flowEfficiency < 0.5) {
    insights.push('Flow efficiency below target - identify and remove blockers');
  }

  return insights;
};

/**
 * Generates optimization recommendations based on metrics
 */
export const generateOptimizations = (metrics, speedMetrics) => {
  const optimizations = [];

  // Focus depth optimizations
  if (metrics.focusDepth < 0.7) {
    optimizations.push('Reduce context switches');
    optimizations.push('Break down complex tasks');
  }

  // Context clarity optimizations
  if (metrics.contextClarity < 0.8) {
    optimizations.push('Document current approach');
    optimizations.push('Create visual task map');
  }

  // Momentum optimizations
  if (metrics.momentum < 0.6) {
    optimizations.push('Start with small wins');
    optimizations.push('Remove immediate blockers');
  }

  // Speed optimizations
  if (speedMetrics.blockingTime > HOUR_IN_MS * 0.2) { // >20% blocked
    optimizations.push('Identify common blockers');
    optimizations.push('Prepare parallel tasks');
  }

  return optimizations;
};

// Private helper functions

const calculateMomentum = (state) => {
  const recentProgress = state.context.recentProgress || 0;
  const blockers = state.context.blockers || 0;
  return Math.max(0, Math.min(1, recentProgress - blockers));
};

const estimateCompletionRate = (transitions) => {
  if (transitions.length < 2) return 0;
  const timeSpan = transitions[transitions.length - 1].timestamp - transitions[0].timestamp;
  return transitions.length / (timeSpan / HOUR_IN_MS); // Per hour
};

const calculateBlockingTime = (transitions) => {
  if (transitions.length < 2) return 0;
  let blockingTime = 0;
  for (let i = 1; i < transitions.length; i++) {
    const gap = transitions[i].timestamp - transitions[i-1].timestamp;
    if (gap > BLOCKING_THRESHOLD_MS) {
      blockingTime += gap;
    }
  }
  return blockingTime;
};

const calculateFlowEfficiency = (transitions) => {
  if (transitions.length < 2) return 0;
  const totalTime = transitions[transitions.length - 1].timestamp - transitions[0].timestamp;
  const blockingTime = calculateBlockingTime(transitions);
  return Math.max(0, Math.min(1, 1 - (blockingTime / totalTime)));
}; 