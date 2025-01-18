/**
 * @typedef {Object} Pattern
 * @property {string} id - Unique identifier for the pattern
 * @property {string} name - Name of the pattern
 * @property {Object} conditions - Pattern matching conditions
 * @property {number} weight - Pattern weight for confidence calculation
 * @property {number} activations - Number of times pattern was activated
 */

/**
 * @typedef {Object} PatternMatch
 * @property {Pattern} pattern - The matched pattern
 * @property {number} confidence - Match confidence score
 */

/**
 * System for detecting and analyzing patterns in autonomic behavior
 */
class PatternSystem {
  constructor() {
    this.patterns = new Map()
    this.matches = []
    this.metrics = {
      totalPatterns: 0,
      activePatterns: 0,
      matchRate: 0
    }
  }

  /**
   * Adds a new pattern
   * @param {Pattern} pattern - Pattern to add
   * @returns {Pattern}
   */
  addPattern(pattern) {
    if (!pattern.id || !pattern.name) {
      throw new Error('Pattern must have id and name')
    }

    this.patterns.set(pattern.id, {
      ...pattern,
      active: true,
      activations: pattern.activations || 0
    })

    this.metrics.totalPatterns++
    this.metrics.activePatterns++

    return pattern
  }

  /**
   * Removes a pattern by id
   * @param {string} patternId - ID of pattern to remove
   */
  removePattern(patternId) {
    const pattern = this.patterns.get(patternId)
    if (pattern && pattern.active) {
      this.metrics.activePatterns--
    }
    this.patterns.delete(patternId)
    this.metrics.totalPatterns--
  }

  /**
   * Updates an existing pattern
   * @param {Pattern} pattern - Updated pattern data
   */
  updatePattern(pattern) {
    if (!this.patterns.has(pattern.id)) {
      throw new Error('Pattern not found')
    }

    const existing = this.patterns.get(pattern.id)
    this.patterns.set(pattern.id, {
      ...existing,
      ...pattern
    })
  }

  /**
   * Gets a pattern by id
   * @param {string} patternId - ID of pattern to get
   * @returns {Pattern|undefined}
   */
  getPattern(patternId) {
    return this.patterns.get(patternId)
  }

  /**
   * Finds patterns matching the current state
   * @param {Object} field - Current field state
   * @param {Object} consciousness - Current consciousness state
   * @returns {Array<PatternMatch>}
   */
  findMatches(field, consciousness) {
    const matches = []
    
    this.patterns.forEach((pattern) => {
      if (!pattern.active) return

      const confidence = this.calculateConfidence(field, consciousness, pattern)
      if (confidence > 0) {
        matches.push({
          pattern,
          confidence
        })
      }
    })

    this.matches = matches
    this.updateMetrics()

    return matches
  }

  /**
   * Activates a pattern by id
   * @param {string} patternId - ID of pattern to activate
   */
  activatePattern(patternId) {
    const pattern = this.patterns.get(patternId)
    if (pattern) {
      pattern.activations++
      this.patterns.set(patternId, pattern)
    }
  }

  /**
   * Calculates match confidence for a pattern
   * @private
   */
  calculateConfidence(field, consciousness, pattern) {
    // Check if any conditions are not met
    if (pattern.conditions.minFieldStrength && field.strength < pattern.conditions.minFieldStrength) {
      return 0;
    }
    if (pattern.conditions.minResonance && field.resonance.amplitude < pattern.conditions.minResonance) {
      return 0;
    }
    if (pattern.conditions.maxResistance && field.flowMetrics.resistance > pattern.conditions.maxResistance) {
      return 0;
    }
    if (pattern.conditions.flowState && consciousness.currentState !== pattern.conditions.flowState) {
      return 0;
    }

    // Base confidence from field metrics
    let confidence = (field.resonance.amplitude * field.strength) / 2;

    // Only boost confidence for flow state patterns
    if (pattern.conditions.flowState && pattern.id === 'flow_pattern') {
      confidence = confidence * 3;
    }

    // Apply pattern weight
    confidence = confidence * pattern.weight;

    return confidence;
  }

  /**
   * Updates system metrics
   * @private
   */
  updateMetrics() {
    const totalMatches = Array.from(this.patterns.values())
      .reduce((sum, pattern) => sum + pattern.activations, 0)

    this.metrics.matchRate = totalMatches / this.metrics.totalPatterns
  }

  /**
   * Gets current system metrics
   * @returns {Object}
   */
  getMetrics() {
    return { ...this.metrics }
  }
}

export { PatternSystem } 