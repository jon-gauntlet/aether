/**
 * @typedef {Object} WorkspaceConfig
 * @property {string} id - Unique identifier for the workspace
 * @property {string} name - Display name for the workspace
 * @property {string} type - Type of workspace (e.g. 'development', 'writing')
 */

/**
 * @typedef {Object} WorkspaceState
 * @property {number} focus - Current focus level (0-1)
 * @property {number} energy - Current energy level (0-1)
 * @property {number} flow - Current flow state level (0-1)
 */

/**
 * @typedef {Object} WorkspaceMetrics
 * @property {number} productivity - Productivity score
 * @property {number} quality - Quality score
 * @property {number} sustainability - Sustainability score
 */

/**
 * @typedef {Object} EnergyField
 * @property {string} type - Type of energy field
 * @property {number} intensity - Intensity level (0-1)
 */

export class Workspace {
  /**
   * @param {WorkspaceConfig} config
   */
  constructor(config) {
    this.id = config.id
    this.name = config.name
    this.type = config.type
    this.state = {
      focus: 0,
      energy: 0,
      flow: 0
    }
    this.metrics = {
      productivity: 0,
      quality: 0,
      sustainability: 0
    }
    this.protectionLevel = 'low'
    this.energyFields = []
  }

  /**
   * @param {WorkspaceState} newState
   */
  updateState(newState) {
    this.state = { ...this.state, ...newState }
    this.metrics = this.calculateMetrics()
  }

  /**
   * @returns {WorkspaceMetrics}
   */
  calculateMetrics() {
    const { focus, energy, flow } = this.state
    return {
      productivity: (focus + energy) / 2,
      quality: (focus + flow) / 2,
      sustainability: (energy + flow) / 2
    }
  }

  /**
   * @param {'high' | 'low'} level
   */
  setProtectionLevel(level) {
    this.protectionLevel = level
  }

  /**
   * @returns {boolean}
   */
  isProtected() {
    return this.protectionLevel === 'high'
  }

  /**
   * @returns {string}
   */
  getProtectionLevel() {
    return this.protectionLevel
  }

  /**
   * @param {EnergyField} field
   */
  createEnergyField(field) {
    this.energyFields.push(field)
  }

  /**
   * @returns {EnergyField[]}
   */
  getEnergyFields() {
    return this.energyFields
  }
}