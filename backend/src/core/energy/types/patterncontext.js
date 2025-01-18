import { FlowState } from '../types/base';
import { Energy, EnergyMetrics } from '../energy/types';

/**
 * @typedef {'ACTIVE' | 'STABLE' | 'EVOLVING' | 'PROTECTED'} PatternState
 */

/**
 * @typedef {Object.<string, any>} PatternContext
 */

/**
 * @typedef {Object.<string, any>} PatternManager
 */

/**
 * @typedef {Object.<string, any>} PatternEvolution
 */

/**
 * @typedef {Object.<string, any>} PatternStorage
 */

export const PatternState = {
  ACTIVE: 'ACTIVE',
  STABLE: 'STABLE',
  EVOLVING: 'EVOLVING',
  PROTECTED: 'PROTECTED'
};

export const PatternContext = {};
export const PatternManager = {};
export const PatternEvolution = {};
export const PatternStorage = {};