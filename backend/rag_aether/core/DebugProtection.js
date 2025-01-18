/**
 * Manages debug protection state and functionality
 */
class DebugProtection {
  constructor() {
    this.debugMode = false;
  }

  /**
   * Enable debug mode
   */
  enableDebug() {
    this.debugMode = true;
  }

  /**
   * Disable debug mode
   */
  disableDebug() {
    this.debugMode = false;
  }

  /**
   * Check if debug mode is enabled
   * @returns {boolean} Whether debug mode is enabled
   */
  isDebugEnabled() {
    return this.debugMode;
  }

  /**
   * Check if the system is protected
   * @returns {boolean} Whether the system is protected
   */
  isProtected() {
    return !this.debugMode;
  }
}

export { DebugProtection };