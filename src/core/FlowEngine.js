/**
 * @typedef {import('./types/base').FlowState} FlowState
 * @typedef {import('./types/base').FlowStats} FlowStats
 * @typedef {import('./types/base').EnergyMetrics} EnergyMetrics
 * @typedef {import('./types/base').Pattern} Pattern
 */

import { validateType } from './types/validation';

/**
 * Engine for managing flow state and related metrics
 */
export class FlowEngine {
  constructor() {
    /** @private @type {FlowState} */
    this.state = null;
    
    /** @private @type {EnergyMetrics} */
    this.energy = null;
    
    /** @private @type {FlowStats} */
    this.metrics = null;
    
    /** @private @type {Pattern[]} */
    this.patterns = [];
  }

  /**
   * Update the current flow state
   * @param {FlowState} newState - New state to apply
   */
  updateState(newState) {
    validateType(newState, 'FlowState');
    if (this.state?.protection > 0) {
      return; // Prevent state changes during protected flow
    }
    this.state = { ...newState };
    this.recordPattern();
  }

  /**
   * Get the current flow state
   * @returns {FlowState}
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Get current energy metrics
   * @returns {EnergyMetrics}
   */
  getEnergy() {
    return { ...this.energy };
  }

  /**
   * Get current flow metrics
   * @returns {FlowStats}
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Update energy metrics
   * @param {EnergyMetrics} metrics - New energy metrics
   */
  updateEnergy(metrics) {
    validateType(metrics, 'EnergyMetrics');
    this.energy = { ...metrics };
    this.adjustProtection();
  }

  /**
   * Update flow metrics
   * @param {FlowStats} metrics - New flow metrics
   */
  updateMetrics(metrics) {
    validateType(metrics, 'FlowStats');
    this.metrics = { ...metrics };
  }

  /**
   * Adjust protection based on energy levels
   * @private
   */
  adjustProtection() {
    if (this.energy.current < this.energy.max * 0.2) {
      this.state.protection = 1;
    } else {
      this.state.protection = 0;
    }
  }

  /**
   * Record current flow pattern
   * @private
   */
  recordPattern() {
    /** @type {Pattern} */
    const pattern = {
      id: `${Date.now()}`,
      type: 'flow',
      frequency: 1,
      success: this.metrics.focus > 80 ? 1 : 0
    };
    validateType(pattern, 'Pattern');
    this.patterns.push(pattern);
    this.prunePatterns();
  }

  /**
   * Prune old patterns to maintain history size
   * @private
   */
  prunePatterns() {
    // Keep only last 100 patterns
    if (this.patterns.length > 100) {
      this.patterns = this.patterns.slice(-100);
    }
  }

  /**
   * Get recorded flow patterns
   * @returns {Pattern[]}
   */
  getPatterns() {
    return [...this.patterns];
  }

  /**
   * Check if currently in flow state
   * @returns {boolean}
   */
  isInFlow() {
    return this.metrics?.focus > 80;
  }

  /**
   * Enter flow state
   * @param {number} depth - Flow depth level
   * @param {boolean} isProtected - Whether to enable protection
   * @returns {Promise<void>}
   */
  async enterFlow(depth, isProtected) {
    if (typeof depth !== 'number' || typeof isProtected !== 'boolean') {
      throw new TypeError('Invalid parameters to enterFlow');
    }
    this.state.protection = isProtected ? 1 : 0;
  }

  /**
   * Exit flow state
   * @param {boolean} active - Whether flow remains active
   * @param {boolean} isProtected - Whether to enable protection
   * @returns {Promise<void>}
   */
  async exitFlow(active, isProtected) {
    if (typeof active !== 'boolean' || typeof isProtected !== 'boolean') {
      throw new TypeError('Invalid parameters to exitFlow');
    }
    this.state.protection = isProtected ? 1 : 0;
  }
}