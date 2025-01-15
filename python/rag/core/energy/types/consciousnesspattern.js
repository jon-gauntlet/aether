import { PatternType, EnergyFlowType } from './order';
import { Pattern } from '../autonomic/types';
import { Energy } from '../energy/types';
import { Flow } from '../flow/types';

/**
 * @typedef {Object} ConsciousnessPattern
 * @property {PatternType} type
 * @property {Energy} energy
 * @property {Flow} flow
 * @property {Object} meta
 * @property {number} meta.depth
 * @property {number} meta.clarity
 * @property {number} meta.presence
 * @augments Pattern
 */

/**
 * @typedef {Object} EnergyFlow
 * @property {EnergyFlowType} type
 * @property {number} strength
 * @property {'inward'|'outward'} direction
 * @property {Object} meta
 * @property {number} meta.quality
 * @property {number} meta.stability
 * @property {number} meta.resonance
 */

/**
 * @typedef {Object} FlowPattern
 * @property {Flow} flow
 * @property {Energy} energy
 * @property {Object} meta
 * @property {number} meta.velocity
 * @property {number} meta.coherence
 * @property {number} meta.harmony
 * @augments Pattern
 */

/**
 * @typedef {Object} AutonomicState
 * @property {Pattern[]} patterns
 * @property {Energy} energy
 * @property {Flow} flow
 * @property {Object} meta
 * @property {number} meta.balance
 * @property {number} meta.stability
 * @property {number} meta.adaptability
 */

/**
 * @typedef {Object} SystemPattern
 * @property {PatternType} type
 * @property {AutonomicState} state
 * @property {Object} meta
 * @property {number} meta.complexity
 * @property {number} meta.resilience
 * @property {number} meta.evolution
 * @augments Pattern
 */

/**
 * @typedef {Object} EnergyIndex
 * @property {number} current
 * @property {number} optimal
 * @property {number} threshold
 * @property {Object} meta
 * @property {number} meta.stability
 * @property {number} meta.volatility
 * @property {number} meta.sustainability
 */