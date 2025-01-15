/**
 * Constants for Flow States
 * @enum {string}
 */
export const FLOW_STATES = {
  FLOW: 'FLOW',
  FOCUS: 'FOCUS',
  RECOVERY: 'RECOVERY',
  HYPERFOCUS: 'HYPERFOCUS'
};

/**
 * Constants for Action Types
 * @enum {string}
 */
export const ACTION_TYPES = {
  ENHANCE_FLOW: 'ENHANCE_FLOW',
  FORCE_TRANSITION: 'FORCE_TRANSITION',
  MODIFY_FIELD: 'MODIFY_FIELD',
  INITIATE_RECOVERY: 'INITIATE_RECOVERY'
};

/**
 * @typedef {typeof FLOW_STATES[keyof typeof FLOW_STATES]} FlowState
 */

/**
 * @typedef {typeof ACTION_TYPES[keyof typeof ACTION_TYPES]} ActionType
 */

/**
 * Validation utilities
 * @param {unknown} value
 * @returns {boolean}
 */
export const isFlowState = (value) =>
  typeof value === 'string' && Object.values(FLOW_STATES).includes(value);

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export const isActionType = (value) =>
  typeof value === 'string' && Object.values(ACTION_TYPES).includes(value); 