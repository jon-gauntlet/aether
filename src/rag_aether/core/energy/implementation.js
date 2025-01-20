import { isEnergyState } from './types';

/**
 * @class
 */
export class EnergySystem {
  /**
   * @param {import('./types').EnergyMetrics} initialMetrics
   */
  constructor(initialMetrics) {
    /** @type {import('./types').EnergyState} */
    this.state = {
      current: initialMetrics,
      baseline: initialMetrics,
      peaks: [initialMetrics]
    };
  }

  /**
   * @returns {import('./types').EnergyState}
   */
  getCurrentState() {
    return this.state;
  }

  /**
   * @param {import('./types').EnergyMetrics} metrics
   * @returns {void}
   */
  updateMetrics(metrics) {
    this.state = {
      current: metrics,
      baseline: this.state.baseline,
      peaks: this.isPeak(metrics) 
        ? [...this.state.peaks, metrics]
        : this.state.peaks
    };
  }

  /**
   * @private
   * @param {import('./types').EnergyMetrics} metrics
   * @returns {boolean}
   */
  isPeak(metrics) {
    return metrics.strength > this.state.current.strength &&
           metrics.resonance > this.state.current.resonance;
  }

  /**
   * @returns {boolean}
   */
  validateState() {
    return isEnergyState(this.state);
  }
} 