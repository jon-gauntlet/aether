/**
 * @typedef {Object} FlowMetrics
 * @property {number} velocity
 * @property {number} momentum
 * @property {number} resistance
 * @property {number} conductivity
 */

export const FlowState = {
  FOCUS: 'FOCUS',
  FLOW: 'FLOW',
  HYPERFOCUS: 'HYPERFOCUS',
  RECOVERING: 'RECOVERING',
  EXHAUSTED: 'EXHAUSTED',
  DISTRACTED: 'DISTRACTED'
};

export const EnergyType = {
  MENTAL: 'MENTAL',
  PHYSICAL: 'PHYSICAL',
  EMOTIONAL: 'EMOTIONAL'
}; 