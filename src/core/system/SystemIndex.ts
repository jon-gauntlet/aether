import { Pattern } from '../autonomic/types';
import { Context } from '../context/types';
import { PatternIndex, EnergyFlowMetrics, IndexStats } from '../types/base';

export interface SystemIndexMetrics {
  patterns: Map<string, PatternIndex>;
  contexts: Map<string, Context>;
  energy: Map<string, EnergyFlowMetrics>;
}

export class SystemIndex {
  private metrics: SystemIndexMetrics = {
    patterns: new Map(),
    contexts: new Map(),
    energy: new Map()
  };

  indexContext(context: Context): void {
    this.metrics.contexts.set(context.id, context);
  }

  indexPattern(pattern: Pattern, context: Context): void {
    const index: PatternIndex = {
      id: pattern.id,
      type: this.determinePatternType(pattern),
      score: this.calculatePatternScore(pattern),
      lastUpdated: new Date(),
      metrics: {
        energyEfficiency: pattern.meta.energyEfficiency || 1,
        flowOptimization: pattern.meta.flowOptimization || 1,
        patternStrength: pattern.meta.successRate || 1
      }
    };
    this.metrics.patterns.set(pattern.id, index);
  }

  updatePatternIndex(pattern: Pattern): void {
    const existing = this.metrics.patterns.get(pattern.id);
    if (existing) {
      this.indexPattern(pattern, pattern.context);
    }
  }

  getMetrics(patternId: string): PatternIndex | undefined {
    return this.metrics.patterns.get(patternId);
  }

  getPatternScore(patternId: string): number {
    const index = this.metrics.patterns.get(patternId);
    return index ? index.score : 1;
  }

  private determinePatternType(pattern: Pattern): 'energy' | 'flow' | 'autonomic' | 'consciousness' {
    if (pattern.meta.type === 'energy') return 'energy';
    if (pattern.meta.type === 'flow') return 'flow';
    if (pattern.meta.type === 'autonomic') return 'autonomic';
    return 'consciousness';
  }

  private calculatePatternScore(pattern: Pattern): number {
    return (
      (pattern.meta.successRate || 1) *
      (pattern.meta.energyEfficiency || 1) *
      (pattern.meta.flowOptimization || 1)
    );
  }
} 