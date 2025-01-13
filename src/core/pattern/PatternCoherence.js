import { Observable, BehaviorSubject } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { MetricRange } from '../../types/base';
import { v4 as uuidv4 } from 'uuid';

export interface PatternMetrics {
  coherence: MetricRange;
  stability: MetricRange;
  evolution: MetricRange;
  quality: number;
}

export interface Pattern {
  id: string;
  context: string;
  metrics: PatternMetrics;
  dependencies: string[];
  evolution: {
    version: number;
    history: string[];
    stability: number;
  };
}

export class PatternCoherence {
  private patterns$ = new BehaviorSubject<Map<string, Pattern>>(new Map());
  
  private readonly QUALITY_WEIGHTS = {
    coherence: 0.4,
    stability: 0.3,
    evolution: 0.3
  };

  constructor() {
    this.initializeCoherenceTracking();
  }

  private initializeCoherenceTracking() {
    setInterval(() => {
      this.updatePatternMetrics();
    }, 30 * 1000); // Every 30 seconds
  }

  private updatePatternMetrics() {
    const patterns = this.patterns$.value;
    const updated = new Map(patterns);

    for (const [id, pattern] of patterns) {
      updated.set(id, {
        ...pattern,
        metrics: this.calculateMetrics(pattern)
      });
    }

    this.patterns$.next(updated);
  }

  private calculateMetrics(pattern: Pattern): PatternMetrics {
    const coherence = this.calculateCoherence(pattern);
    const stability = this.calculateStability(pattern);
    const evolution = this.calculateEvolution(pattern);
    
    const quality = this.calculateQuality({
      coherence,
      stability,
      evolution,
      quality: 0 // Placeholder, will be calculated
    });

    return {
      coherence,
      stability,
      evolution,
      quality
    };
  }

  private calculateCoherence(pattern: Pattern): MetricRange {
    return {
      min: 0,
      max: 1,
      optimal: 0.8,
      current: pattern.evolution.stability
    };
  }

  private calculateStability(pattern: Pattern): MetricRange {
    return {
      min: 0,
      max: 1,
      optimal: 0.9,
      current: Math.min(1, pattern.evolution.version / 10)
    };
  }

  private calculateEvolution(pattern: Pattern): MetricRange {
    return {
      min: 0,
      max: 1,
      optimal: 0.7,
      current: pattern.evolution.stability
    };
  }

  public evaluateQuality(contextId: string): number {
    const patterns = Array.from(this.patterns$.value.values())
      .filter(p => p.context === contextId);

    if (patterns.length === 0) return 1; // Default to optimal if no patterns

    return patterns.reduce((acc, pattern) => {
      return acc + this.calculateQuality(pattern.metrics);
    }, 0) / patterns.length;
  }

  private calculateQuality(metrics: PatternMetrics): number {
    const coherenceFactor = metrics.coherence.current / metrics.coherence.optimal;
    const stabilityFactor = metrics.stability.current / metrics.stability.optimal;
    const evolutionFactor = metrics.evolution.current / metrics.evolution.optimal;

    return (
      coherenceFactor * this.QUALITY_WEIGHTS.coherence +
      stabilityFactor * this.QUALITY_WEIGHTS.stability +
      evolutionFactor * this.QUALITY_WEIGHTS.evolution
    );
  }

  public repairPatterns(contextId: string) {
    const patterns = Array.from(this.patterns$.value.values())
      .filter(p => p.context === contextId);

    for (const pattern of patterns) {
      if (pattern.metrics.quality < 0.7) {
        this.repairPattern(pattern);
      }
    }
  }

  private repairPattern(pattern: Pattern) {
    const updated: Pattern = {
      ...pattern,
      evolution: {
        ...pattern.evolution,
        version: pattern.evolution.version + 1,
        stability: Math.min(1, pattern.evolution.stability * 1.2),
        history: [...pattern.evolution.history, pattern.id]
      }
    };

    const patterns = this.patterns$.value;
    patterns.set(pattern.id, updated);
    this.patterns$.next(patterns);
  }

  public observePatterns(contextId: string): Observable<Pattern[]> {
    return this.patterns$.pipe(
      map(patterns => 
        Array.from(patterns.values()).filter(p => p.context === contextId)
      ),
      distinctUntilChanged()
    );
  }
} 