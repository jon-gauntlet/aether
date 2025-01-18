import { BehaviorSubject, Observable } from 'rxjs';
import { Field, FlowState } from '../types/base';
import { ConsciousnessState } from '../types/consciousness';
import { Energy, EnergyMetrics } from '../energy/types';

/**
 * @typedef {Object} ContextData
 * @property {string} id - Context identifier
 * @property {number} timestamp - Creation timestamp
 * @property {FlowState} flowState - Current flow state
 * @property {ConsciousnessState} consciousness - Consciousness state
 * @property {EnergyMetrics} energy - Energy metrics
 * @property {Object.<string, any>} [metadata] - Additional metadata
 */

/**
 * System for managing context data and history
 */
export class ContextSystemImpl {
  constructor() {
    this.history = [];
    this.context$ = new BehaviorSubject(this.createEmptyContext());
  }

  /**
   * Get context history
   * @public
   * @param {number} [limit] - Maximum number of entries to return
   * @returns {ContextData[]}
   */
  getHistory(limit) {
    return limit ? this.history.slice(-limit) : this.history;
  }

  /**
   * Get context data within a time range
   * @public
   * @param {number} startTime - Start timestamp
   * @param {number} endTime - End timestamp
   * @returns {ContextData[]}
   */
  getContextByTimeRange(startTime, endTime) {
    return this.history.filter(context => 
      context.timestamp >= startTime && 
      context.timestamp <= endTime
    );
  }

  /**
   * Clear context history
   * @public
   * @returns {void}
   */
  clearHistory() {
    this.history = [];
    this.context$.next(this.createEmptyContext());
  }

  /**
   * Create empty context data
   * @private
   * @returns {ContextData}
   */
  createEmptyContext() {
    return {
      id: Date.now().toString(),
      timestamp: Date.now(),
      flowState: {},
      consciousness: {},
      energy: {},
      metadata: {}
    };
  }
}