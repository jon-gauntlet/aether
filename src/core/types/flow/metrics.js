/**
 * @typedef {Object} FlowMetrics
 * @property {number} velocity - Speed of flow state progression
 * @property {number} momentum - Sustained flow intensity
 * @property {number} resistance - Barriers to flow
 * @property {number} conductivity - Ease of entering flow
 * @property {number} focus - Mental concentration
 * @property {number} energy - Available resources
 * @property {number} clarity - Mental acuity
 * @property {number} quality - Overall flow quality
 */

/**
 * Default values for flow metrics
 * @type {FlowMetrics}
 */
export const DEFAULT_FLOW_METRICS = {
  // Core metrics
  velocity: 0.8,
  momentum: 0.8,
  resistance: 0.2,
  conductivity: 0.8,

  // Extended metrics
  focus: 0.9,
  energy: 0.85,
  clarity: 0.9,
  quality: 0.85
};

/**
 * @param {FlowMetrics} metrics
 * @returns {boolean}
 */
export const isOptimalMetrics = (metrics) => {
  return Object.values(metrics).every(value => 
    value >= 0.8 || (metrics.resistance === value && value <= 0.2)
  );
};

/**
 * @param {FlowMetrics} metrics
 * @returns {number}
 */
export const calculateMetricsAverage = (metrics) => {
  const values = Object.values(metrics).filter(value => value !== metrics.resistance);
  const resistanceContribution = 1 - metrics.resistance;
  return (values.reduce((sum, value) => sum + value, 0) + resistanceContribution) / (values.length + 1);
};

/**
 * @param {FlowMetrics} metrics
 * @returns {number}
 */
export const calculateFlowQuality = (metrics) => {
  const weights = {
    velocity: 0.2,
    momentum: 0.2,
    resistance: -0.15,
    conductivity: 0.15,
    focus: 0.1,
    energy: 0.1,
    clarity: 0.1
  };

  return Object.entries(weights).reduce((quality, [key, weight]) => {
    const value = metrics[key];
    return quality + (key === 'resistance' ? (1 - value) * weight : value * weight);
  }, 0);
};

/**
 * @typedef {Object} StateTransitions
 * @property {number} toFlow
 * @property {number} toHyperfocus
 * @property {number} toRecovery
 * @property {number} toExhaustion
 */

/**
 * @typedef {Object} SessionMetrics
 * @property {number} averageFlowDuration - Average duration of flow states
 * @property {number} peakFlowFrequency - Frequency of achieving peak flow states
 * @property {number} entropyTrend - Trend in system entropy over time
 * @property {number} flowEfficiency - Ratio of productive flow time to total time
 * @property {number} protectionRate - Success rate of flow state protection
 * @property {number} recoverySpeed - Average time to recover optimal flow
 * @property {StateTransitions} stateTransitions - Counts of different state transitions
 */

/**
 * @type {SessionMetrics}
 */
export const DEFAULT_SESSION_METRICS = {
  averageFlowDuration: 0,
  peakFlowFrequency: 0,
  entropyTrend: 0,
  flowEfficiency: 0,
  protectionRate: 0,
  recoverySpeed: 0,
  stateTransitions: {
    toFlow: 0,
    toHyperfocus: 0,
    toRecovery: 0,
    toExhaustion: 0
  }
};
