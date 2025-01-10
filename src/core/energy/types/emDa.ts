import { BehaviorSubject, Observable } from 'rxjs';
import { Energy, EnergyMetrics } from '../energy/types';
import { EnergyPattern, PatternState } from './types';

export interface EvolutionState {
  patterns: EnergyPattern[];
  currentGeneration: number;
  metrics: {
    successRate: number;
    adaptability: number;
    stability: number;
  };
}

export class PatternEvolution {
  private state$: BehaviorSubject<EvolutionState>;
  private readonly MAX_PATTERNS = 100;
  private readonly STABILITY_THRESHOLD = 0.7;
  private readonly PROTECTION_THRESHOLD = 0.85;

  constructor() {
    this.state$ = new BehaviorSubject<EvolutionState>({
      patterns: [],
      currentGeneration: 0,
      metrics: {
        successRate: 1.0,
        adaptability: 0.8,
        stability: 1.0
      }
    });
  }

  public getState(): Observable<EvolutionState> {
    return this.state$.asObservable();
  }

  public evolvePattern(
    pattern: EnergyPattern,
    context: {
      energyLevels: Energy;
      metrics: EnergyMetrics;
    },
    wasSuccessful: boolean
  ): EnergyPattern {
    const currentState = this.state$.getValue();
    const evolutionHistory = [...pattern.evolution.history, {
      timestamp: new Date(),
      changes: {
        energyLevels: context.energyLevels,
        metrics: context.metrics
      },
      success: wasSuccessful
    }];

    const successRate = this.calculateSuccessRate(evolutionHistory);
    const stability = this.calculateStability(evolutionHistory);
    const adaptability = this.calculateAdaptability(evolutionHistory);

    const evolvedPattern: EnergyPattern = {
      ...pattern,
      energyLevels: context.energyLevels,
      metrics: {
        ...context.metrics,
        adaptability,
        stability
      },
      state: this.determinePatternState(stability, successRate),
      evolution: {
        version: pattern.evolution.version + 1,
        history: evolutionHistory
      }
    };

    // Update pattern collection
    const patterns = currentState.patterns.map(p =>
      p.id === pattern.id ? evolvedPattern : p
    );

    if (!patterns.includes(evolvedPattern)) {
      patterns.push(evolvedPattern);
      if (patterns.length > this.MAX_PATTERNS) {
        patterns.sort((a, b) => {
          const aScore = this.calculatePatternScore(a);
          const bScore = this.calculatePatternScore(b);
          return bScore - aScore;
        });
        patterns.length = this.MAX_PATTERNS;
      }
    }

    this.state$.next({
      patterns,
      currentGeneration: currentState.currentGeneration + 1,
      metrics: {
        successRate: this.calculateOverallSuccessRate(patterns),
        adaptability: this.calculateOverallAdaptability(patterns),
        stability: this.calculateOverallStability(patterns)
      }
    });

    return evolvedPattern;
  }

  private calculateSuccessRate(history: Array<{
    timestamp: Date;
    changes: any;
    success: boolean;
  }>): number {
    if (history.length === 0) return 1;
    return history.filter(h => h.success).length / history.length;
  }

  private calculateStability(history: Array<{
    timestamp: Date;
    changes: any;
    success: boolean;
  }>): number {
    if (history.length < 2) return 1;

    let stabilityScore = 0;
    for (let i = 1; i < history.length; i++) {
      const prev = history[i - 1].changes;
      const curr = history[i].changes;
      
      const energyStability = 1 - Math.abs(
        this.calculateAverageEnergy(prev.energyLevels) -
        this.calculateAverageEnergy(curr.energyLevels)
      );

      const metricsStability = 1 - Math.abs(
        prev.metrics.efficiency - curr.metrics.efficiency
      );

      stabilityScore += (energyStability * 0.6 + metricsStability * 0.4);
    }

    return stabilityScore / (history.length - 1);
  }

  private calculateAdaptability(history: Array<{
    timestamp: Date;
    changes: any;
    success: boolean;
  }>): number {
    if (history.length < 2) return 0.8;

    const recentHistory = history.slice(-5);
    const successfulAdaptations = recentHistory.filter((h, i) => {
      if (i === 0) return h.success;
      const prevSuccess = recentHistory[i - 1].success;
      return !prevSuccess && h.success; // Counts successful recoveries
    }).length;

    return Math.min(1, 0.6 + (successfulAdaptations * 0.08));
  }

  private determinePatternState(
    stability: number,
    successRate: number
  ): PatternState {
    if (stability >= this.PROTECTION_THRESHOLD && successRate >= this.PROTECTION_THRESHOLD) {
      return PatternState.PROTECTED;
    } else if (stability >= this.STABILITY_THRESHOLD && successRate >= this.STABILITY_THRESHOLD) {
      return PatternState.STABLE;
    } else if (stability >= 0.5 && successRate >= 0.5) {
      return PatternState.EVOLVING;
    } else {
      return PatternState.UNSTABLE;
    }
  }

  private calculatePatternScore(pattern: EnergyPattern): number {
    const successRate = this.calculateSuccessRate(pattern.evolution.history);
    const stability = pattern.metrics?.stability || 0;
    const adaptability = pattern.metrics?.adaptability || 0;

    return (
      successRate * 0.4 +
      stability * 0.3 +
      adaptability * 0.3
    );
  }

  private calculateAverageEnergy(energy: Energy): number {
    return (energy.mental + energy.physical + energy.emotional) / 3;
  }

  private calculateOverallSuccessRate(patterns: EnergyPattern[]): number {
    if (patterns.length === 0) return 1;
    return patterns.reduce((sum, p) =>
      sum + this.calculateSuccessRate(p.evolution.history), 0
    ) / patterns.length;
  }

  private calculateOverallAdaptability(patterns: EnergyPattern[]): number {
    if (patterns.length === 0) return 0.8;
    return patterns.reduce((sum, p) =>
      sum + (p.metrics?.adaptability || 0.8), 0
    ) / patterns.length;
  }

  private calculateOverallStability(patterns: EnergyPattern[]): number {
    if (patterns.length === 0) return 1;
    return patterns.reduce((sum, p) =>
      sum + (p.metrics?.stability || 1), 0
    ) / patterns.length;
  }
} 