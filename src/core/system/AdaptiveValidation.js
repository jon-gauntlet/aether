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
    }, 5000);
  }

  private adaptThresholds() {
    const thresholds = this.thresholds$.value;
    const history = this.history$.value;
    let adapted = false;

    thresholds.forEach((threshold, type) => {
      const typeHistory = history.filter(h => h.type === type);
      if (typeHistory.length === 0) return;

      const successRate = this.calculateSuccessRate(typeHistory);
      const energyCorrelation = this.calculateEnergyCorrelation(typeHistory);
      const contextResonance = this.calculateContextResonance(typeHistory);

      // Natural threshold adaptation
      const adaptedThreshold = {
        ...threshold,
        energyFactor: this.adaptFactor(threshold.energyFactor, energyCorrelation),
        contextFactor: this.adaptFactor(threshold.contextFactor, contextResonance),
        historyFactor: this.adaptFactor(threshold.historyFactor, successRate)
      };

      if (JSON.stringify(adaptedThreshold) !== JSON.stringify(threshold)) {
        thresholds.set(type, adaptedThreshold);
        adapted = true;
      }
    });

    if (adapted) {
      this.thresholds$.next(new Map(thresholds));
    }
  }

  private evolvePatterns() {
    const patterns = this.patterns$.value;
    const history = this.history$.value;
    let evolved = false;

    patterns.forEach((pattern, id) => {
      const patternHistory = history.filter(h => 
        h.type === pattern.type &&
        h.context.some(c => pattern.context.includes(c))
      );

      if (patternHistory.length === 0) return;

      const successRate = this.calculateSuccessRate(patternHistory);
      const energyCorrelation = this.calculateEnergyCorrelation(patternHistory);
      const contextResonance = this.calculateContextResonance(patternHistory);

      const evolvedPattern = {
        ...pattern,
        history: patternHistory,
        learning: {
          successRate,
          energyCorrelation,
          contextResonance
        }
      };

      if (JSON.stringify(evolvedPattern) !== JSON.stringify(pattern)) {
        patterns.set(id, evolvedPattern);
        evolved = true;
      }
    });

    if (evolved) {
      this.patterns$.next(new Map(patterns));
    }
  }

  private pruneHistory() {
    const history = this.history$.value
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, this.HISTORY_WINDOW);

    this.history$.next(history);
  }

  private adaptFactor(current: number, correlation: number): number {
    return Math.max(0, Math.min(1,
      current + (correlation > 0.7 ? this.LEARNING_RATE : -this.LEARNING_RATE)
    ));
  }

  private calculateSuccessRate(history: ValidationHistory[]): number {
    return history.filter(h => h.success).length / history.length;
  }

  private calculateEnergyCorrelation(history: ValidationHistory[]): number {
    if (history.length < 2) return 0;

    const energyLevels = history.map(h => h.energy);
    const successRates = history.map(h => h.success ? 1 : 0);

    return this.calculateCorrelation(energyLevels, successRates);
  }

  private calculateContextResonance(history: ValidationHistory[]): number {
    if (history.length < 2) return 0;

    const contextSets = history.map(h => new Set(h.context));
    const similarities = [];

    for (let i = 0; i < contextSets.length - 1; i++) {
      for (let j = i + 1; j < contextSets.length; j++) {
        similarities.push(this.calculateJaccardSimilarity(contextSets[i], contextSets[j]));
      }
    }

    return similarities.reduce((sum, val) => sum + val, 0) / similarities.length;
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b);
    const sumY = y.reduce((a, b) => a + b);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

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
        successRate: 1.0,
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
    const validation: ValidationHistory = {
      id: uuidv4(),
      type,
      timestamp: Date.now(),
      success,
      energy,
      context,
      metrics
    };

    const history = [validation, ...this.history$.value];
    this.history$.next(history);
  }

  public calculateThreshold(
    type: string,
    energy: number,
    context: string[]
  ): number {
    const threshold = this.thresholds$.value.get(type);
    if (!threshold) return 1.0;

    const history = this.history$.value.filter(h => 
      h.type === type &&
      h.context.some(c => context.includes(c))
    );

    const successRate = this.calculateSuccessRate(history);
    const energyCorrelation = this.calculateEnergyCorrelation(history);
    const contextResonance = this.calculateContextResonance(history);

    const value = threshold.base +
      (energy * threshold.energyFactor) +
      (contextResonance * threshold.contextFactor) +
      (successRate * threshold.historyFactor);

    return Math.max(threshold.minValue,
      Math.min(threshold.maxValue, value)
    );
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

    const typeHistory = this.history$.value
      .filter(h => h.type === type)
      .sort((a, b) => b.timestamp - a.timestamp);

    const typePatterns = Array.from(this.patterns$.value.values())
      .filter(p => p.type === type);

    return {
      threshold,
      history: {
        recent: typeHistory.slice(0, 10),
        successRate: this.calculateSuccessRate(typeHistory),
        energyCorrelation: this.calculateEnergyCorrelation(typeHistory),
        contextResonance: this.calculateContextResonance(typeHistory)
      },
      patterns: {
        count: typePatterns.length,
        averageSuccess: typePatterns.reduce((sum, p) => sum + p.learning.successRate, 0) / typePatterns.length,
        contextCoverage: this.calculateContextCoverage(typePatterns)
      }
    };
  }

  private calculateContextCoverage(patterns: ValidationPattern[]): number {
    const allContexts = new Set<string>();
    const coveredContexts = new Set<string>();

    patterns.forEach(pattern => {
      pattern.context.forEach(c => allContexts.add(c));
      if (pattern.learning.successRate >= this.MIN_CONFIDENCE) {
        pattern.context.forEach(c => coveredContexts.add(c));
      }
    });

    return coveredContexts.size / allContexts.size;
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