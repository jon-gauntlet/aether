import { FlowState, FlowMetrics, Field, EnergyType } from '../base';

/**
 * @typedef {Object.<string, any>} AutonomicMetrics
 */

/**
 * @typedef {Object.<string, any>} UseAutonomicDevelopment
 */

/**
 * Default metrics object
 * @type {Object.<string, any>}
 */
const defaultMetrics = {
  energyState: {},
  autonomicMetrics: {}
};

/**
 * Default field configuration
 * @type {Object}
 */
const defaultField = {
  radius: 0,
  strength: 0,
  waves: []
};

/**
 * @type {Function}
 */
export const useAutonomicState = () => {
  return { 
    flowState$: null,
    defaultMetrics,
    defaultField
  };
};