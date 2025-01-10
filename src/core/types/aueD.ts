import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { EnergyState } from '../energy/EnergySystem';
import { v4 as uuidv4 } from 'uuid';

export interface ValidationThreshold {
  id: string;
  type: string;
  base: number;
  energyFactor: number;
  contextFactor: number;
  historyFactor: number;
  minValue: number;
  maxValue: number;
}

export interface ValidationHistory {
  id: string;
  type: string;
  timestamp: number;
  success: boolean;
  energy: number;
  context: string[];
  metrics: {
    confidence: number;
    impact: number;
    resonance: number;
  };
}

export interface ValidationPattern {
  id: string;
  type: string;
  context: string[];
  thresholds: Map<string, number>;
  history: ValidationHistory[];
  learning: {
    successRate: number;
    energyCorrelation: number;
    contextResonance: number;
  };
}

export class AdaptiveValidation {
  private thresholds$ = new BehaviorSubject<Map<string, ValidationThreshold>>(new Map());
  private patterns$ = new BehaviorSubject<Map<string, ValidationPattern>>(new Map());
  private history$ = new BehaviorSubject<ValidationHistory[]>([]);

  private readonly HISTORY_WINDOW = 100;
  private readonly LEARNING_RATE = 0.1;
  private readonly MIN_CONFIDENCE = 0.3;

  constructor() {
    this.initializeThresholds();
    this.startAdaptationCycle();
  }

  private initializeThresholds() {
    const thresholds = new Map<string, ValidationThreshold>();

    // Type safety thresholds
    thresholds.set('type_safety', {
      id: uuidv4(),
      type: 'type_safety',
      base: 0.8,
      energyFactor: 0.2,
      contextFactor: 0.1,
      historyFactor: 0.1,
      minValue: 0.6,
      maxValue: 0.95
    });

    // Pattern coherence thresholds
    thresholds.set('pattern_coherence', {
      id: uuidv4(),
      type: 'pattern_coherence',
      base: 0.7,
      energyFactor: 0.15,
      contextFactor: 0.15,
      historyFactor: 0.15,
      minValue: 0.5,
      maxValue: 0.9
    });

    // Flow protection thresholds
    thresholds.set('flow_protection', {
      id: uuidv4(),
      type: 'flow_protection',
      base: 0.75,
      energyFactor: 0.25,
      contextFactor: 0.1,
      historyFactor: 0.1,
      minValue: 0.6,
      maxValue: 1.0
    });

    this.thresholds$.next(thresholds);
  }

  private startAdaptationCycle() {
    setInterval(() => {
      this.adaptThresholds();
      this.evolvePatterns();
      this.pruneHistory();
    }, 60 * 1000); // Every minute
  }

  private adaptThresholds() {
    const thresholds = this.thresholds$.value;
    const history = this.history$.value;
    const updated = new Map(thresholds);

    for (const [type, threshold] of thresholds) {
      const typeHistory = history.filter(h => h.type === type);
      if (typeHistory.length === 0) continue;

      const successRate = this.calculateSuccessRate(typeHistory);
      const energyCorrelation = this.calculateEnergyCorrelation(typeHistory);
      const contextResonance = this.calculateContextResonance(typeHistory);

      const energyFactor = this.adaptFactor(threshold.energyFactor, energyCorrelation);
      const contextFactor = this.adaptFactor(threshold.contextFactor, contextResonance);
      const historyFactor = this.adaptFactor(threshold.historyFactor, successRate);

      updated.set(type, {
        ...threshold,
        energyFactor,
        contextFactor,
        historyFactor
      });
    }

    this.thresholds$.next(updated);
  }

  private evolvePatterns() {
    const patterns = this.patterns$.value;
    const history = this.history$.value;
    const updated = new Map(patterns);

    for (const [id, pattern] of patterns) {
      const patternHistory = history.filter(h => 
        h.type === pattern.type && 
        h.context.some(c => pattern.context.includes(c))
      );

      if (patternHistory.length === 0) continue;

      const learning = {
        successRate: this.calculateSuccessRate(patternHistory),
        energyCorrelation: this.calculateEnergyCorrelation(patternHistory),
        contextResonance: this.calculateContextResonance(patternHistory)
      };

      updated.set(id, {
        ...pattern,
        learning
      });
    }

    this.patterns$.next(updated);
  }

  private pruneHistory() {
    const history = this.history$.value;
    const recent = history.slice(-this.HISTORY_WINDOW);
    this.history$.next(recent);
  }

  private adaptFactor(current: number, correlation: number): number {
    return Math.max(0.1, Math.min(0.9, current + (correlation - 0.5) * this.LEARNING_RATE));
  }

  private calculateSuccessRate(history: ValidationHistory[]): number {
    return history.filter(h => h.success).length / history.length;
  }

  private calculateEnergyCorrelation(history: ValidationHistory[]): number {
    const energies = history.map(h => h.energy);
    const successes = history.map(h => h.success ? 1 : 0);
    return this.calculateCorrelation(energies, successes);
  }

  private calculateContextResonance(history: ValidationHistory[]): number {
    const contextSets = history.map(h => new Set(h.context));
    let totalSimilarity = 0;

    for (let i = 0; i < contextSets.length; i++) {
      for (let j = i + 1; j < contextSets.length; j++) {
        totalSimilarity += this.calculateJaccardSimilarity(contextSets[i], contextSets[j]);
      }
    }

    const pairs = (contextSets.length * (contextSets.length - 1)) / 2;
    return pairs > 0 ? totalSimilarity / pairs : 0;
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const xMean = x.reduce((a, b) => a + b) / x.length;
    const yMean = y.reduce((a, b) => a + b) / y.length;

    const numerator = x.reduce((sum, xi, i) => 
      sum + (xi - xMean) * (y[i] - yMean), 0
    );

    const denominator = Math.sqrt(
      x.reduce((sum, xi) => sum + Math.pow(xi - xMean, 2), 0) *
      y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0)
    );

    return denominator === 0 ? 0 : numerator / denominator;
  }

  private calculateJaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size;
  }

  public createPattern(type: string, context: string[]): string {
    const id = uuidv4();
    const pattern: ValidationPattern = {
      id,
      type,
      context,
      thresholds: new Map(),
      history: [],
      learning: {
        successRate: 0.5,
        energyCorrelation: 0,
        contextResonance: 0
      }
    };

    const patterns = this.patterns$.value;
    patterns.set(id, pattern);
    this.patterns$.next(patterns);

    return id;
  }

  public recordValidation(
    type: string,
    success: boolean,
    energy: number,
    context: string[],
    metrics: ValidationHistory['metrics']
  ): void {
    const history = this.history$.value;
    const validation: ValidationHistory = {
      id: uuidv4(),
      type,
      timestamp: Date.now(),
      success,
      energy,
      context,
      metrics
    };

    history.push(validation);
    this.history$.next(history);
  }

  public calculateThreshold(
    type: string,
    energy: number,
    context: string[]
  ): number {
    const threshold = this.thresholds$.value.get(type);
    if (!threshold) return 0.5;

    const patterns = Array.from(this.patterns$.value.values())
      .filter(p => p.type === type && p.context.some(c => context.includes(c)));

    if (patterns.length === 0) return threshold.base;

    const averageLearning = patterns.reduce(
      (acc, p) => ({
        successRate: acc.successRate + (p.learning.successRate / patterns.length),
        energyCorrelation: acc.energyCorrelation + (p.learning.energyCorrelation / patterns.length),
        contextResonance: acc.contextResonance + (p.learning.contextResonance / patterns.length)
      }),
      { successRate: 0, energyCorrelation: 0, contextResonance: 0 }
    );

    const value = threshold.base +
      (energy - 0.5) * threshold.energyFactor +
      (averageLearning.contextResonance - 0.5) * threshold.contextFactor +
      (averageLearning.successRate - 0.5) * threshold.historyFactor;

    return Math.max(threshold.minValue, Math.min(threshold.maxValue, value));
  }

  public getValidationInsights(type: string): {
    threshold: ValidationThreshold;
    history: {
      recent: ValidationHistory[];
      successRate: number;
      energyCorrelation: number;
      contextResonance: number;
    };
    patterns: {
      count: number;
      averageSuccess: number;
      contextCoverage: number;
    };
  } | undefined {
    const threshold = this.thresholds$.value.get(type);
    if (!threshold) return undefined;

    const history = this.history$.value.filter(h => h.type === type);
    const patterns = Array.from(this.patterns$.value.values()).filter(p => p.type === type);

    return {
      threshold,
      history: {
        recent: history.slice(-10),
        successRate: this.calculateSuccessRate(history),
        energyCorrelation: this.calculateEnergyCorrelation(history),
        contextResonance: this.calculateContextResonance(history)
      },
      patterns: {
        count: patterns.length,
        averageSuccess: patterns.reduce((sum, p) => sum + p.learning.successRate, 0) / patterns.length,
        contextCoverage: this.calculateContextCoverage(patterns)
      }
    };
  }

  private calculateContextCoverage(patterns: ValidationPattern[]): number {
    if (patterns.length === 0) return 0;

    const allContexts = new Set<string>();
    const uniqueContexts = new Set<string>();

    patterns.forEach(p => {
      p.context.forEach(c => {
        allContexts.add(c);
        uniqueContexts.add(c);
      });
    });

    return uniqueContexts.size / allContexts.size;
  }

  public observeThreshold(type: string): Observable<ValidationThreshold | undefined> {
    return this.thresholds$.pipe(
      map(thresholds => thresholds.get(type)),
      distinctUntilChanged()
    );
  }

  public observePattern(patternId: string): Observable<ValidationPattern | undefined> {
    return this.patterns$.pipe(
      map(patterns => patterns.get(patternId)),
      distinctUntilChanged()
    );
  }

  public observeHistory(type: string): Observable<ValidationHistory[]> {
    return this.history$.pipe(
      map(history => history.filter(h => h.type === type)),
      distinctUntilChanged()
    );
  }
} 