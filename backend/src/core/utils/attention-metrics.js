/**
 * Calculate metrics from system state
 * @param {Object} systemState - Current system state
 * @returns {Object} Calculated attention metrics
 */
export function calculateAttentionMetrics(systemState) {
  const { focus, energy, context = {} } = systemState
  const { clarity = 1, recentProgress = 0, blockers = 0 } = context

  return {
    focusDepth: focus,
    contextClarity: clarity,
    energyReserves: energy,
    momentum: Math.max(0, recentProgress - blockers)
  }
}

/**
 * Calculate speed metrics from transitions
 * @param {Array} transitions - List of transitions with timestamps
 * @returns {Object} Speed metrics
 */
export function calculateSpeedMetrics(transitions) {
  if (!transitions.length) {
    return {
      iterationRate: 0,
      completionRate: 0,
      blockingTime: 0,
      flowEfficiency: 0
    }
  }

  const now = Date.now()
  const totalTime = now - transitions[0].timestamp
  const gaps = []

  for (let i = 1; i < transitions.length; i++) {
    const gap = transitions[i].timestamp - transitions[i-1].timestamp
    if (gap > 600000) { // 10 minutes
      gaps.push(gap)
    }
  }

  const blockingTime = gaps.reduce((sum, gap) => sum + gap, 0)
  const flowTime = totalTime - blockingTime
  
  return {
    iterationRate: transitions.length / (totalTime / 3600000), // per hour
    completionRate: transitions.length / (blockingTime / 3600000 || 1), // per blocked hour
    blockingTime,
    flowEfficiency: flowTime / totalTime
  }
}

/**
 * Analyze attention patterns
 * @param {Object} attentionMetrics - Current attention metrics
 * @param {Object} speedMetrics - Current speed metrics
 * @returns {string[]} Insights about the patterns
 */
export function analyzeAttentionPatterns(attentionMetrics, speedMetrics) {
  const insights = []

  if (attentionMetrics.focusDepth > 0.8 && speedMetrics.flowEfficiency > 0.8) {
    insights.push('Optimal flow state detected - protect from interruptions')
  }

  if (attentionMetrics.contextClarity < 0.6) {
    insights.push('Context clarity dropping - consider documenting current state')
  }

  if (attentionMetrics.momentum < 0.5) {
    insights.push('Momentum is low - check for blockers')
  }

  return insights
}

/**
 * Generate optimization recommendations
 * @param {Object} attentionMetrics - Current attention metrics
 * @param {Object} speedMetrics - Current speed metrics
 * @returns {string[]} Optimization recommendations
 */
export function generateOptimizations(attentionMetrics, speedMetrics) {
  const optimizations = []

  if (attentionMetrics.focusDepth < 0.6) {
    optimizations.push('Reduce context switches')
    optimizations.push('Break down complex tasks')
  }

  if (attentionMetrics.momentum < 0.5) {
    optimizations.push('Start with small wins')
    optimizations.push('Remove immediate blockers')
  }

  if (speedMetrics.blockingTime > 1800000) { // 30 minutes
    optimizations.push('Review and reduce blocking activities')
  }

  return optimizations
}