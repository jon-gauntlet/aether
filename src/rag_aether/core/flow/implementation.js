export class FlowSystem {
  constructor(initialPatterns = []) {
    this.startTime = Date.now();
    this.transitions = [];
    this.currentState = {
      type: 'focus',
      depth: 0.5,
      duration: 0,
      patterns: initialPatterns
    };
    this.validStates = ['focus', 'deep', 'peak', 'recovery'];
  }

  getCurrentState() {
    return {
      ...this.currentState,
      duration: Date.now() - this.startTime
    };
  }

  transition(to, trigger) {
    // Basic validation
    if (!to || !this.validStates.includes(to)) {
      throw new Error('Invalid flow state transition');
    }

    const from = this.getCurrentState();
    const newState = {
      type: to,
      depth: this.calculateNewDepth(to),
      duration: 0,
      patterns: from.patterns
    };

    this.transitions.push({
      from,
      to: newState,
      timestamp: Date.now(),
      trigger
    });

    this.startTime = Date.now();
    this.currentState = newState;
  }

  addPattern(pattern) {
    this.currentState = {
      ...this.currentState,
      patterns: [...this.currentState.patterns, pattern]
    };
  }

  getMetrics() {
    return {
      averageDepth: this.calculateAverageDepth(),
      totalDuration: this.calculateTotalDuration(),
      transitionCount: this.transitions.length,
      recoveryTime: this.calculateRecoveryTime()
    };
  }

  calculateNewDepth(type) {
    switch (type) {
      case 'deep': return Math.min(this.currentState.depth + 0.2, 1);
      case 'peak': return 1;
      case 'recovery': return Math.max(this.currentState.depth - 0.3, 0);
      default: return this.currentState.depth;
    }
  }

  calculateAverageDepth() {
    if (this.transitions.length === 0) return this.currentState.depth;
    
    const totalDepth = this.transitions.reduce(
      (sum, t) => sum + t.from.depth,
      this.currentState.depth
    );
    
    return totalDepth / (this.transitions.length + 1);
  }

  calculateTotalDuration() {
    const transitionDuration = this.transitions.reduce(
      (sum, t) => sum + t.from.duration,
      0
    );
    return transitionDuration + this.getCurrentState().duration;
  }

  calculateRecoveryTime() {
    const recoveryTransitions = this.transitions.filter(
      t => t.to.type === 'recovery'
    );
    
    return recoveryTransitions.reduce(
      (sum, t) => sum + t.from.duration,
      0
    );
  }
} 