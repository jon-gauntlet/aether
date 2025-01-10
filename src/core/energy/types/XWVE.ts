import { BehaviorSubject, Observable } from 'rxjs';
import { Pattern, PatternState } from '../../types/patterns';

interface Context {
  depth: number;
  tags: string[];
}

interface Energy {
  level: number;
  type: string;
}

interface Flow {
  state: string;
  metrics: {
    coherence: number;
    resonance: number;
  };
}

interface Learning {
  id: string;
  context: Context;
  energy: Energy;
  flow: Flow;
  timestamp: number;
  notes?: string;
}

export class PatternSystem {
  private patterns$ = new BehaviorSubject<Pattern[]>([]);
  private learnings: Learning[] = [];

  constructor() {
    // Initialize with empty state
  }

  async applyPattern(context: Context, energy: Energy, flow: Flow): Promise<Pattern | null> {
    const patterns = this.patterns$.value;
    if (patterns.length === 0) return null;

    // Find best matching pattern based on context and energy
    const matches = patterns.map(pattern => ({
      pattern,
      score: this.calculateMatchScore(pattern, context, energy, flow)
    }));

    matches.sort((a, b) => b.score - a.score);
    return matches[0].score > 0.5 ? matches[0].pattern : null;
  }

  async recordLearning(
    pattern: Partial<Pattern>,
    context: Context,
    notes?: string
  ): Promise<Pattern> {
    const timestamp = Date.now();
    const learning: Learning = {
      id: pattern.id || `pattern-${timestamp}`,
      context,
      energy: {
        level: pattern.energyLevel || 0.5,
        type: 'natural'
      },
      flow: {
        state: 'active',
        metrics: {
          coherence: 0.7,
          resonance: 0.8
        }
      },
      timestamp,
      notes
    };

    this.learnings.push(learning);

    // Create or update pattern
    const existingPattern = this.patterns$.value.find(p => p.id === learning.id);
    const newPattern: Pattern = existingPattern
      ? this.evolvePattern(existingPattern, learning)
      : this.createPattern(learning);

    const patterns = this.patterns$.value.filter(p => p.id !== newPattern.id);
    this.patterns$.next([...patterns, newPattern]);

    return newPattern;
  }

  getPatterns(): Observable<Pattern[]> {
    return this.patterns$.asObservable();
  }

  getLearningHistory(patternId: string): Learning[] {
    return this.learnings.filter(l => l.id === patternId);
  }

  private calculateMatchScore(
    pattern: Pattern,
    context: Context,
    energy: Energy,
    flow: Flow
  ): number {
    // Context match
    const contextScore = pattern.context.reduce((score, tag) => {
      return score + (context.tags.includes(tag) ? 1 : 0);
    }, 0) / Math.max(pattern.context.length, context.tags.length);

    // Energy match
    const energyScore = 1 - Math.abs(pattern.energyLevel - energy.level);

    // Flow match
    const flowScore = flow.metrics.coherence * flow.metrics.resonance;

    // Weighted average
    return (contextScore * 0.5) + (energyScore * 0.3) + (flowScore * 0.2);
  }

  private evolvePattern(pattern: Pattern, learning: Learning): Pattern {
    const recentLearnings = this.learnings
      .filter(l => l.id === pattern.id)
      .slice(-5);

    const energyLevel = recentLearnings.reduce(
      (sum, l) => sum + l.energy.level,
      0
    ) / recentLearnings.length;

    const successRate = recentLearnings.reduce(
      (sum, l) => sum + l.flow.metrics.coherence,
      0
    ) / recentLearnings.length;

    return {
      ...pattern,
      energyLevel,
      successRate,
      states: this.determineStates(energyLevel, successRate)
    };
  }

  private createPattern(learning: Learning): Pattern {
    return {
      id: learning.id,
      name: `Pattern ${learning.id}`,
      description: learning.notes || 'Automatically discovered pattern',
      energyLevel: learning.energy.level,
      successRate: learning.flow.metrics.coherence,
      context: learning.context.tags,
      states: this.determineStates(learning.energy.level, learning.flow.metrics.coherence)
    };
  }

  private determineStates(energyLevel: number, successRate: number): PatternState[] {
    const states: PatternState[] = [PatternState.ACTIVE];

    if (successRate > 0.8) {
      states.push(PatternState.STABLE);
    }

    if (energyLevel > 0.7) {
      states.push(PatternState.EVOLVING);
    }

    if (successRate > 0.9 && energyLevel > 0.8) {
      states.push(PatternState.PROTECTED);
    }

    return states;
  }
} 