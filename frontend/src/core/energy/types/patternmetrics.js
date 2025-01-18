import { Energy, EnergyMetrics } from '../energy/types';
import { FlowState } from '../../../types/base';

/**
 * @typedef {'EVOLVING' | 'STABLE' | 'PROTECTED'} PatternState
 */

/**
 * @typedef {Object} PatternMetrics
 * @property {Object.<string, any>} [metadata] - Optional metadata
 */

/**
 * @typedef {Object.<string, any>} PatternManager
 */

export const PatternState = {
  EVOLVING: 'EVOLVING',
  STABLE: 'STABLE',
  PROTECTED: 'PROTECTED'
};

export const PatternMetrics = {};
export const PatternManager = {};