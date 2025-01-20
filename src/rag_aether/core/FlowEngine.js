/**
 * @typedef {Object} FlowState
 * @property {number} depth - The current flow depth
 * @property {boolean} active - Whether flow is active
 * @property {boolean} protected - Whether flow is protected
 */

/**
 * Manages flow state and transitions
 */
class FlowEngine {
  constructor() {
    this.state = {
      depth: 0,
      active: false,
      protected: false
    };
  }

  /**
   * Check if currently in flow
   * @returns {boolean} Whether in flow state
   */
  isInFlow() {
    return this.state.active;
  }

  /**
   * Enter flow state
   * @param {number} depth - The flow depth to enter
   * @param {boolean} isProtected - Whether to protect the flow
   * @returns {Promise<void>}
   */
  async enterFlow(depth, isProtected) {
    this.state = {
      depth,
      active: true,
      protected: isProtected
    };
  }

  /**
   * Exit flow state
   * @param {boolean} active - Whether to remain partially active
   * @param {boolean} isProtected - Whether to maintain protection
   * @returns {Promise<void>}
   */
  async exitFlow(active, isProtected) {
    this.state = {
      depth: active ? this.state.depth / 2 : 0,
      active,
      protected: isProtected
    };
  }
}

export { FlowEngine };