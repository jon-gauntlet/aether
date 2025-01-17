import { BehaviorSubject } from 'rxjs';
import { validateType } from '../types/validation';

/**
 * @typedef {import('../types/stream').Stream} Stream
 * @typedef {import('./types/flowstate').FlowState} FlowState
 */

/**
 * Implementation of flow state management
 */
class FlowImpl {
  constructor() {
    /** @private @type {BehaviorSubject<FlowState>} */
    this.flowSubject = new BehaviorSubject(null);
    
    /** @private @type {number} */
    this.timestamp = Date.now();
  }

  /**
   * Observe flow state changes
   * @returns {BehaviorSubject<FlowState>}
   */
  observeFlow() {
    return this.flowSubject;
  }

  /**
   * Update flow state
   * @param {FlowState} state - New flow state
   */
  updateFlow(state) {
    validateType(state, 'FlowState');
    this.timestamp = Date.now();
    this.flowSubject.next(state);
  }

  /**
   * Get current flow state
   * @returns {FlowState}
   */
  getCurrentFlow() {
    return this.flowSubject.getValue();
  }

  /**
   * Get last update timestamp
   * @returns {number}
   */
  getLastUpdate() {
    return this.timestamp;
  }

  /**
   * Check if flow is active
   * @returns {boolean}
   */
  isActive() {
    const state = this.getCurrentFlow();
    return state?.active ?? false;
  }

  /**
   * Check if flow is protected
   * @returns {boolean}
   */
  isProtected() {
    const state = this.getCurrentFlow();
    return state?.protected ?? false;
  }
}

export { FlowImpl };