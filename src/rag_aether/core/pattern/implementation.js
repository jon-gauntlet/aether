export class PatternSystem {
  constructor() {
    this.patterns = new Map();
  }

  addPattern(pattern) {
    // Basic validation
    if (!pattern || !pattern.id || !pattern.state || !pattern.energy) {
      throw new Error('Invalid pattern structure');
    }
    this.patterns.set(pattern.id, pattern);
  }

  getPattern(id) {
    return this.patterns.get(id);
  }

  updatePatternState(id, state) {
    const pattern = this.patterns.get(id);
    if (!pattern) {
      throw new Error('Pattern not found');
    }

    this.patterns.set(id, {
      ...pattern,
      state
    });
  }

  updatePatternEnergy(id, current) {
    const pattern = this.patterns.get(id);
    if (!pattern) {
      throw new Error('Pattern not found');
    }

    this.patterns.set(id, {
      ...pattern,
      energy: {
        ...pattern.energy,
        current
      }
    });
  }

  getActivePatterns() {
    return Array.from(this.patterns.values())
      .filter(pattern => pattern.state.active);
  }
} 