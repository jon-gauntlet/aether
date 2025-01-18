/**
 * @typedef {Object} FlowPattern
 * @property {string} type - Pattern type
 * @property {number} strength - Pattern strength
 */

/**
 * Manages natural flow patterns and states
 */
class NaturalFlow {
  constructor() {
    this.flowPatterns = new Map();
  }

  /**
   * Observe current flow state
   * @returns {Map<string, FlowPattern>} Current flow patterns
   */
  observeFlow() {
    return new Map(this.flowPatterns);
  }

  /**
   * Observe specific patterns
   * @param {Array<string>} types - Pattern types to observe
   * @returns {Array<FlowPattern>} Matching patterns
   */
  observePatterns(types) {
    return types
      .map(type => this.flowPatterns.get(type))
      .filter(Boolean);
  }
}

export { NaturalFlow };