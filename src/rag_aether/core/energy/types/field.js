import { Energy } from '../energy/types';

/**
 * @typedef {'FOCUS' | 'FLOW' | 'BREAK' | 'RECOVERING' | 'TRANSITIONING'} FlowState
 */

/**
 * @typedef {Object.<string, any>} Field
 */

export const FlowState = {
  FOCUS: 'FOCUS',
  FLOW: 'FLOW',
  BREAK: 'BREAK',
  RECOVERING: 'RECOVERING',
  TRANSITIONING: 'TRANSITIONING'
};

export const Field = {};