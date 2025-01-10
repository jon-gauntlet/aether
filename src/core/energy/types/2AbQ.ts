import { Pattern, Learning } from './types';
import { Context } from '../context/types';
import { Energy } from '../energy/types';
import { Flow } from '../flow/types';
import { AutonomicPatternLibrary } from './PatternLibrary';

export class PatternManager {
  private library: AutonomicPatternLibrary;
  private activePatterns: Map<string, Pattern>;
  private contextHistory: Context[];

  constructor() {
    this.library = new AutonomicPatternLibrary();
    this.activePatterns = new Map();
    this.contextHistory = [];
  }

  async applyPattern(context: Context, energy: Energy, flow: Flow): Promise<Pattern | null> {
    // Record context
    this.contextHistory.push(context);

    // Find matching patterns
    const patterns = this.library.findPattern(context);
    if (patterns.length === 0) {
      return null;
    }

    // Select best pattern based on current state
    const selectedPattern = this.selectPattern(patterns, energy, flow);
    
    // Track active pattern
    this.activePatterns.set(context.id, selectedPattern);

    return selectedPattern;
  }

  async recordLearning(pattern: Pattern, context: Context, insight: string): Promise<Pattern> {
    const learning: Learning = {
      id: context.id,
      timestamp: new Date(),
      insight,
      context,
      pattern
    };

    // Evolve pattern with new learning
    const evolvedPattern = this.library.evolvePattern(pattern, learning);

    // Update active pattern if needed
    if (this.activePatterns.has(context.id)) {
      this.activePatterns.set(context.id, evolvedPattern);
    }

    return evolvedPattern;
  }

  private selectPattern(patterns: Pattern[], energy: Energy, flow: Flow): Pattern {
    return patterns.reduce((best, current) => {
      const bestScore = this.scorePattern(best, energy, flow);
      const currentScore = this.scorePattern(current, energy, flow);
      return currentScore > bestScore ? current : best;
    });
  }

  private scorePattern(pattern: Pattern, energy: Energy, flow: Flow): number {
    // Base score from pattern success rate
    let score = pattern.meta.successRate;

    // Adjust for energy state match
    if (pattern.energy.type === energy.type) {
      score *= 1.2;
    }
    if (pattern.energy.flow === energy.flow) {
      score *= 1.3;
    }

    // Adjust for flow state match
    if (pattern.flow.state === flow.state) {
      score *= 1.5;
    }

    // Consider usage frequency (prefer less used patterns when scores are close)
    score *= (1 - Math.log(pattern.meta.useCount + 1) * 0.1);

    return score;
  }

  getActivePattern(contextId: string): Pattern | undefined {
    return this.activePatterns.get(contextId);
  }

  getContextHistory(): Context[] {
    return [...this.contextHistory];
  }
} 