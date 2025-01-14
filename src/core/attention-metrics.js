/**
 * @typedef {Object} SystemState
 * @property {number} focus - Current focus level (0-1)
 * @property {number} energy - Current energy level (0-1)
 * @property {number} flow - Current flow level (0-1)
 * @property {Object} [context] - Optional context information
 * @property {number} [context.clarity] - Context clarity level (0-1)
 * @property {number} [context.depth] - Context depth level (0-1)
 * @property {Object} [progress] - Optional progress information
 * @property {number} [progress.recent] - Recent progress level (0-1)
 * @property {number} [progress.blockers] - Blocker impact level (0-1)
 * @property {Array<Object>} [transitions] - Optional state transitions
 * @property {string} [transitions.type] - Type of transition
 * @property {number} [transitions.duration] - Duration of transition
 * @property {Array<Object>} [patterns] - Optional pattern information
 * @property {string} [patterns.type] - Type of pattern
 * @property {number} [patterns.occurrences] - Number of pattern occurrences
 * @property {number} [patterns.stability] - Pattern stability level (0-1)
 */

/**
 * @typedef {Object} AttentionMetrics
 * @property {number} focusLevel - Focus level metric (0-1)
 * @property {number} contextClarity - Context clarity metric (0-1)
 * @property {number} energyReserves - Energy reserves metric (0-1)
 * @property {number} momentum - Development momentum metric (0-1)
 * @property {number} [iterationRate] - Optional iteration rate metric
 * @property {number} [completionRate] - Optional completion rate metric
 * @property {number} [flowEfficiency] - Optional flow efficiency metric
 * @property {number} [blockingRatio] - Optional blocking ratio metric
 * @property {number} [patternStrength] - Optional pattern strength metric
 * @property {number} [patternDiversity] - Optional pattern diversity metric
 * @property {number} [patternStability] - Optional pattern stability metric
 * @property {Array<string>} [recommendations] - Optional improvement recommendations
 */

/**
 * Calculates attention metrics from the current system state
 * @param {SystemState} state - Current system state
 * @returns {AttentionMetrics} Calculated attention metrics
 */
export function calculateAttentionMetrics(state) {
  const metrics = {
    focusLevel: state.focus || 0,
    contextClarity: state.context?.clarity || 0.5,
    energyReserves: state.energy || 0,
    momentum: 0,
    recommendations: []
  }

  // Calculate momentum from progress and blockers
  if (state.progress) {
    metrics.momentum = (state.progress.recent || 0) - (state.progress.blockers || 0)
  }

  // Calculate speed metrics if transitions exist
  if (state.transitions?.length > 0) {
    const totalTime = state.transitions.reduce((sum, t) => sum + t.duration, 0)
    const flowTime = state.transitions
      .filter(t => t.type === 'flow')
      .reduce((sum, t) => sum + t.duration, 0)
    const blockTime = state.transitions
      .filter(t => t.type === 'block')
      .reduce((sum, t) => sum + t.duration, 0)

    metrics.flowEfficiency = flowTime / totalTime
    metrics.blockingRatio = blockTime / totalTime
  }

  // Calculate pattern metrics if patterns exist
  if (state.patterns?.length > 0) {
    metrics.patternStrength = state.patterns.reduce((sum, p) => sum + p.occurrences, 0) / state.patterns.length
    metrics.patternDiversity = state.patterns.length / 10 // Normalize to 0-1 range
    metrics.patternStability = state.patterns.reduce((sum, p) => sum + (p.stability || 0), 0) / state.patterns.length
  }

  // Generate recommendations
  if (state.focus < 0.6) {
    metrics.recommendations.push('focus')
  }
  if (state.energy < 0.4) {
    metrics.recommendations.push('energy')
  }
  if (metrics.momentum < 0.3) {
    metrics.recommendations.push('momentum')
  }

  return metrics
} 