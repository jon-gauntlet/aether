/**
 * @typedef {'natural' | 'guided' | 'autonomous'} FlowType
 * @typedef {'deep' | 'light' | 'surface'} PresenceType
 * @typedef {'low' | 'medium' | 'high' | 'peak'} FlowIntensity
 */

/**
 * @enum {string}
 */
export const FlowStateType = {
  FOCUS: 'FOCUS',
  FLOW: 'FLOW',
  HYPERFOCUS: 'HYPERFOCUS',
  RECOVERING: 'RECOVERING',
  EXHAUSTED: 'EXHAUSTED',
  DISTRACTED: 'DISTRACTED'
};

/**
 * @typedef {Object} FlowState
 * @property {boolean} active
 * @property {FlowStateType} type
 * @property {FlowIntensity} intensity
 * @property {number} duration
 * @property {FlowMetrics} metrics
 * @property {number} lastTransition
 * @property {boolean} protected
 * @property {number} quality
 */

/**
 * @enum {string}
 */
export const DevelopmentPhase = {
  Initial: 'initial',
  Learning: 'learning',
  Practicing: 'practicing',
  Mastering: 'mastering',
  Teaching: 'teaching',
  Evolving: 'evolving'
};

/**
 * @typedef {Object} Flow
 * @property {string} id
 * @property {FlowType} type
 * @property {FlowMetrics} metrics
 * @property {ProtectionState} protection
 * @property {Pattern[]} patterns
 * @property {number} timestamp
 */

/**
 * @typedef {Object} FlowTransition
 * @property {FlowState} from
 * @property {FlowState} to
 * @property {number} duration
 * @property {number} quality
 * @property {number} efficiency
 */

/**
 * @typedef {Object} FlowContext
 * @property {string} id
 * @property {FlowState} state
 * @property {ProtectionState} protection
 * @property {FlowTransition[]} transitions
 * @property {FlowMetrics} metrics
 * @property {Pattern[]} patterns
 */

export { FlowMetrics } from './metrics';
export { ProtectionState } from '../protection/protection';

