import { FlowState } from '../types/primitives/base';

/**
 * @typedef {Object} SystemState
 * @property {number} health - System health level (0-1)
 * @property {number} energy - System energy level (0-1)
 * @property {number} focus - System focus level (0-1)
 * @property {Object} context - Current system context
 */

/**
 * @typedef {Object} FlowMetrics
 * @property {number} focus - Focus level (0-1)
 * @property {number} momentum - Momentum level (0-1)
 * @property {number} quality - Quality level (0-1)
 * @property {number} duration - Time in current state
 */

/**
 * @typedef {Object} FlowState
 * @property {boolean} active - Whether flow is active
 * @property {string} type - Flow state type (FOCUSED, FLOW, etc)
 * @property {number} intensity - Flow intensity level (0-1)
 * @property {number} duration - Time in flow state
 * @property {FlowMetrics} metrics - Flow metrics
 * @property {number} lastTransition - Timestamp of last transition
 * @property {boolean} protected - Whether flow is protected
 * @property {number} quality - Flow quality metric (0-1)
 * @property {Object} [context] - Flow context
 * @property {boolean} [contextPreserved] - Whether context is preserved
 * @property {number} [transitionCount] - Number of transitions
 * @property {number} [recoveryCount] - Number of recoveries
 */

export class FlowEngine {
  constructor() {
    /** @type {SystemState} */
    this.systemState = {
      health: 1,
      energy: 1,
      focus: 1,
      context: {}
    };

    /** @type {FlowState} */
    this.currentFlow = {
      active: false,
      type: 'natural',
      intensity: 0.5,
      duration: 0,
      metrics: {
        focus: 0.8,
        momentum: 0.7,
        quality: 0.9,
        duration: 0
      },
      lastTransition: Date.now(),
      protected: false,
      quality: 0.8,
      transitionCount: 0,
      recoveryCount: 0
    };

    /** @type {Set<Function>} */
    this.observers = new Set();
  }

  /**
   * Subscribe to flow state changes
   * @param {Function} callback
   * @returns {{unsubscribe: Function}}
   */
  observe() {
    return {
      subscribe: (callback) => {
        this.observers.add(callback);
        callback(this.currentFlow);
        return {
          unsubscribe: () => {
            this.observers.delete(callback);
          }
        };
      }
    };
  }

  /**
   * Notify observers of state change
   */
  notifyObservers() {
    this.observers.forEach(callback => callback(this.currentFlow));
  }

  /**
   * @param {Object} [context] - Flow context
   */
  startFlow(context) {
    let now = Date.now();
    if (now === this.currentFlow.lastTransition) {
      now = now + 1;
    }

    const wasActive = this.currentFlow.active;
    this.currentFlow = {
      ...this.currentFlow,
      active: true,
      type: 'flow',
      intensity: 0.8,
      context,
      contextPreserved: true,
      lastTransition: now,
      transitionCount: this.currentFlow.transitionCount
    };
    this.notifyObservers();
  }

  maintainFlow() {
    if (!this.currentFlow.active) return;

    let now = Date.now();
    if (now === this.currentFlow.lastTransition) {
      now = now + 1;
    }

    // Update flow metrics
    this.currentFlow.duration += 1;
    this.currentFlow.metrics.duration += 1;
    this.currentFlow.quality = this.calculateQuality();
    this.currentFlow.lastTransition = now;

    // Check for health issues
    if (this.currentFlow.quality < 0.7) {
      this.suggestBreak();
    }
    this.notifyObservers();
  }

  /**
   * @returns {FlowState}
   */
  endFlow() {
    // Capture final state
    const finalState = { ...this.currentFlow };

    let now = Date.now();
    if (now === this.currentFlow.lastTransition) {
      now = now + 1;
    }

    // Reset flow
    this.currentFlow = {
      active: false,
      type: 'natural',
      intensity: 0.5,
      duration: 0,
      metrics: {
        focus: 0.8,
        momentum: 0.7,
        quality: 0.9,
        duration: 0
      },
      lastTransition: now,
      protected: false,
      quality: 0.8,
      transitionCount: this.currentFlow.transitionCount,
      recoveryCount: this.currentFlow.recoveryCount
    };
    this.notifyObservers();

    return finalState;
  }

  /**
   * @param {Object} options
   * @param {number} options.intensity - New flow intensity
   */
  adjustFlow(options) {
    let now = Date.now();
    if (now === this.currentFlow.lastTransition) {
      now = now + 1;
    }

    const hasChanges = Object.entries(options).some(([key, value]) => this.currentFlow[key] !== value);
    this.currentFlow = {
      ...this.currentFlow,
      ...options,
      lastTransition: now,
      transitionCount: hasChanges ? this.currentFlow.transitionCount + 1 : this.currentFlow.transitionCount
    };
    this.notifyObservers();
  }

  interrupt() {
    let now = Date.now();
    if (now === this.currentFlow.lastTransition) {
      now = now + 1;
    }

    const wasInterrupted = this.currentFlow.type === 'distracted';
    this.currentFlow = {
      ...this.currentFlow,
      type: 'distracted',
      active: false,
      lastTransition: now,
      recoveryCount: this.currentFlow.recoveryCount + 1,
      transitionCount: wasInterrupted ? this.currentFlow.transitionCount : this.currentFlow.transitionCount + 1
    };
    this.notifyObservers();
  }

  resume() {
    let now = Date.now();
    if (now === this.currentFlow.lastTransition) {
      now = now + 1;
    }

    const wasActive = this.currentFlow.active;
    this.currentFlow = {
      ...this.currentFlow,
      type: 'natural',
      active: true,
      lastTransition: now,
      transitionCount: wasActive ? this.currentFlow.transitionCount : this.currentFlow.transitionCount + 1
    };
    this.notifyObservers();
  }

  /**
   * @returns {string[]}
   */
  getSuggestions() {
    const suggestions = ['Maintain steady flow state'];
    
    if (this.currentFlow.metrics.momentum < 0.5) {
      suggestions.push('Build momentum through consistent focus');
    }

    if (this.currentFlow.quality < 0.8) {
      suggestions.push('Take a short break to restore flow quality');
    }

    return suggestions;
  }

  /**
   * @returns {Object[]}
   */
  analyzePatterns() {
    return [{
      type: 'FLOW_CYCLE',
      efficiency: 0.8,
      duration: this.currentFlow.duration
    }];
  }

  /**
   * @returns {number}
   */
  calculateQuality() {
    return Math.min(
      1,
      (this.systemState.health + this.systemState.energy + this.systemState.focus) / 3
    );
  }

  suggestBreak() {
    console.log('Flow quality decreasing - consider taking a short break');
  }

  /**
   * @param {string} mode
   */
  setMode(mode) {
    this.currentFlow = {
      ...this.currentFlow,
      type: mode,
      lastTransition: Date.now()
    };
    this.notifyObservers();
  }

  /**
   * @returns {Promise<void>}
   */
  async protect() {
    this.currentFlow = {
      ...this.currentFlow,
      protected: true,
      lastTransition: Date.now()
    };
    this.notifyObservers();
  }

  /**
   * @returns {Promise<void>}
   */
  async deepen() {
    this.currentFlow = {
      ...this.currentFlow,
      intensity: Math.min(1, this.currentFlow.intensity + 0.1),
      lastTransition: Date.now()
    };
    this.notifyObservers();
  }

  /**
   * @returns {Promise<FlowState>}
   */
  async measure() {
    return this.currentFlow;
  }

  /**
   * @param {string} to
   * @param {string} trigger
   * @returns {Promise<{from: string, to: string, trigger: string}>}
   */
  async transition(to, trigger) {
    const from = this.currentFlow.type;
    this.currentFlow = {
      ...this.currentFlow,
      type: to,
      lastTransition: Date.now()
    };
    this.notifyObservers();
    return { from, to, trigger };
  }
}

export default FlowEngine; 