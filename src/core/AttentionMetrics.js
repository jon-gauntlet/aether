/**
 * @typedef {import('./types/base').FlowMetrics} FlowMetrics
 */

/**
 * @typedef {Object} AttentionMetrics
 * @property {function(number, number, ...any): number} updateMetrics - Update attention metrics
 * @property {function(number, number, ...any): boolean} isHighAttention - Check if attention is high
 * @property {function(number, number, ...any): boolean} isLowAttention - Check if attention is low
 */

/**
 * Implementation of attention metrics tracking
 * @implements {AttentionMetrics}
 */
class AttentionMetricsImpl {
  constructor() {
    /** @private @type {FlowMetrics} */
    this.metrics = null;
  }

  /**
   * Update attention metrics
   * @param {number} momentum - Current momentum value
   * @param {number} clarity - Current clarity value
   * @param {...any} args - Additional parameters
   * @returns {number} Updated attention value
   */
  updateMetrics(momentum, clarity, ...args) {
    const { focus } = this.metrics;
    return (focus + momentum + clarity) / 3;
  }

  /**
   * Check if attention is high
   * @param {number} momentum - Current momentum value
   * @param {number} clarity - Current clarity value
   * @param {...any} args - Additional parameters
   * @returns {boolean} True if attention is high
   */
  isHighAttention(momentum, clarity, ...args) {
    return this.updateMetrics(momentum, clarity, ...args) >= 80;
  }

  /**
   * Check if attention is low
   * @param {number} momentum - Current momentum value
   * @param {number} clarity - Current clarity value
   * @param {...any} args - Additional parameters
   * @returns {boolean} True if attention is low
   */
  isLowAttention(momentum, clarity, ...args) {
    return this.updateMetrics(momentum, clarity, ...args) <= 40;
  }
}

export { AttentionMetricsImpl };