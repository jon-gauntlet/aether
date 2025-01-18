import { Field, FlowState } from './base';
import { Energy } from '../energy/types';

/**
 * @typedef {Object} ConsciousnessMetrics
 * @property {number} clarity
 * @property {number} depth
 * @property {number} coherence
 * @property {number} integration
 * @property {number} flexibility
 */

/**
 * @typedef {Object} FlowSpace
 * @property {number} dimensions
 * @property {number} capacity
 * @property {number} utilization
 * @property {number} stability
 * @property {Field[]} fields
 * @property {Array} boundaries
 */

/**
 * @typedef {Object} StateHistoryEntry
 * @property {Date} timestamp
 * @property {FlowState} state
 * @property {number} duration
 */

/**
 * @typedef {Object} ConsciousnessState
 * @property {FlowState} currentState
 * @property {Field[]} fields
 * @property {FlowSpace} flowSpace
 * @property {Date} lastTransition
 * @property {StateHistoryEntry[]} stateHistory
 * @property {ConsciousnessMetrics} metrics
 * @property {Energy} energy
 */ 