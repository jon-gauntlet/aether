/**
 * Arsenal for managing and validating types in the system
 */
export class TypeArsenal {
  constructor() {
    this.validators = new Map();
    this.recommendations = new Map();
    this.history = new Map();
  }

  registerValidator(type, validator) {
    this.validators.set(type, validator);
    if (!this.history.has(type)) {
      this.history.set(type, []);
    }
  }

  validate(type, state) {
    const validator = this.validators.get(type);
    if (!validator) {
      throw new Error(`No validator registered for type: ${type}`);
    }

    const result = validator(state);
    const history = this.history.get(type);
    
    // Keep only the last 2 validations
    if (history.length >= 2) {
      history.shift();
    }
    
    history.push({
      timestamp: Date.now(),
      state,
      result
    });

    return result;
  }

  addRecommendation(type, generator) {
    this.recommendations.set(type, generator);
  }

  getRecommendations(type, state) {
    const generator = this.recommendations.get(type);
    return generator ? generator(state) : [];
  }

  getValidationHistory(type) {
    return this.history.get(type) || [];
  }

  analyzeTrends() {
    let improvement = false;
    
    for (const [type, history] of this.history.entries()) {
      if (history.length < 2) continue;
      
      const latest = history[history.length - 1];
      const previous = history[history.length - 2];
      
      // Compare scores and ensure they exist
      if (latest.result.score && previous.result.score) {
        improvement = latest.result.score > previous.result.score;
        if (improvement) break;
      }
    }

    return { improvement };
  }
}