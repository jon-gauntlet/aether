import { Pattern, Learning } from './types';
import { Context } from '../context/types';
import { Energy } from '../energy/types';
import { Flow } from '../flow/types';
import { AutonomicPatternLibrary } from './PatternLibrary';
import { SystemIndex } from '../index/types';

export class PatternManager {
  private library: AutonomicPatternLibrary;
  private activePatterns: Map<string, Pattern>;
  private contextHistory: Context[];
  private systemIndex: SystemIndex;

  constructor() {
    this.library = new AutonomicPatternLibrary();
    this.activePatterns = new Map();
    this.contextHistory = [];
    this.systemIndex = new SystemIndex();
  }

  async applyPattern(context: Context, energy: Energy, flow: Flow): Promise<Pattern | null> {
    // Record context and index it
    this.contextHistory.push(context);
    this.systemIndex.indexContext(context);

    // Find matching patterns using indexed search
    const patterns = this.library.findPattern(context, this.systemIndex);
    if (patterns.length === 0) {
      return null;
    }

    // Select best pattern based on current state and index metrics
    const selectedPattern = this.selectPattern(patterns, energy, flow);
    
    // Track and index active pattern
    this.activePatterns.set(context.id, selectedPattern);
    this.systemIndex.indexPattern(selectedPattern, context);

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

    // Evolve pattern with new learning and update indices
    const evolvedPattern = this.library.evolvePattern(pattern, learning);
    this.systemIndex.updatePatternIndex(evolvedPattern);

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
    // Include index-based scoring
    let score = pattern.meta.successRate * this.systemIndex.getPatternScore(pattern.id);

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

    return score;
  }

  getActivePattern(contextId: string): Pattern | undefined {
    return this.activePatterns.get(contextId);
  }

  getContextHistory(): Context[] {
    return [...this.contextHistory];
  }
} 