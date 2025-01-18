/**
 * @typedef {'resting'|'flow'|'deep_flow'|'recovery'|'error'} FlowState
 */

/**
 * @type {Object<string, FlowState>}
 */
export const FLOW_STATES = {
  RESTING: 'resting',
  FLOW: 'flow',
  DEEP_FLOW: 'deep_flow',
  RECOVERY: 'recovery',
  ERROR: 'error'
};

/**
 * @type {Object<FlowState, number>}
 */
export const FLOW_THRESHOLDS = {
  resting: 0.3,
  flow: 0.6,
  deep_flow: 0.8,
  recovery: 0.4,
  error: 0
};

/**
 * @type {Object<FlowState, number>}
 */
export const FLOW_DURATIONS = {
  resting: 5 * 60 * 1000, // 5 minutes
  flow: 25 * 60 * 1000, // 25 minutes
  deep_flow: 45 * 60 * 1000, // 45 minutes
  recovery: 15 * 60 * 1000, // 15 minutes
  error: 0
}; 