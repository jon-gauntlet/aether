import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { EnergyState } from '../energy/EnergySystem';
import { v4 as uuidv4 } from 'uuid';

export interface EvolutionMetrics {
  strength: number;
  coherence: number;
  resonance: number;
  stability: number;
  adaptability: number;
}

export interface PatternState {
  id: string;
  type: 'structural' | 'behavioral' | 'cognitive';
  stage: number;
  metrics: EvolutionMetrics;
  history: {
    timestamp: number;
    metrics: EvolutionMetrics;
  }[];
}

export class PatternEvolution {
  private patterns$ = new BehaviorSubject<Map<string, PatternState>>(new Map());
  private readonly EVOLUTION_THRESHOLD = 0.8;
  private readonly STABILITY_THRESHOLD = 0.7;
  private readonly HISTORY_LIMIT = 100;

  constructor() {
    this.startEvolutionCycle();
  }

  private startEvolutionCycle() {
    setInterval(() => {
      const patterns = this.patterns$.value;
      let evolved = false;

      patterns.forEach((pattern, id) => {
        if (this.shouldEvolve(pattern)) {
          const evolvedPattern = this.evolvePattern(pattern);
          patterns.set(id, evolvedPattern);
          evolved = true;
        }
      });

      if (evolved) {
        this.patterns$.next(new Map(patterns));
      }
    }, 5000); // Check every 5 seconds
  }

  private shouldEvolve(pattern: PatternState): boolean {
    if (pattern.history.length < 5) return false;

    const recentMetrics = pattern.history.slice(-5).map(h => h.metrics);
    const avgStrength = this.calculateAverage(recentMetrics.map(m => m.strength));
    const avgStability = this.calculateAverage(recentMetrics.map(m => m.stability));

    return avgStrength >= this.EVOLUTION_THRESHOLD && avgStability >= this.STABILITY_THRESHOLD;
  }

  private evolvePattern(pattern: PatternState): PatternState {
    const newStage = Math.min(10, pattern.stage + 1);
    const evolutionBonus = 0.1;

    return {
      ...pattern,
      stage: newStage,
      metrics: {
        ...pattern.metrics,
        strength: Math.min(1, pattern.metrics.strength + evolutionBonus),
        adaptability: Math.min(1, pattern.metrics.adaptability + evolutionBonus)
      }
    };
  }

  private calculateAverage(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  public observePattern(id: string): Observable<PatternState | undefined> {
    return this.patterns$.pipe(
      map(patterns => patterns.get(id)),
      distinctUntilChanged()
    );
  }

  public observeAllPatterns(): Observable<PatternState[]> {
    return this.patterns$.pipe(
      map(patterns => Array.from(patterns.values())),
      distinctUntilChanged()
    );
  }

  public createPattern(
    type: PatternState['type'],
    initialMetrics: Partial<EvolutionMetrics> = {}
  ): string {
    const id = uuidv4();
    const pattern: PatternState = {
      id,
      type,
      stage: 1,
      metrics: {
        strength: initialMetrics.strength ?? 0.1,
        coherence: initialMetrics.coherence ?? 0.1,
        resonance: initialMetrics.resonance ?? 0.1,
        stability: initialMetrics.stability ?? 0.1,
        adaptability: initialMetrics.adaptability ?? 0.1
      },
      history: []
    };

    const patterns = this.patterns$.value;
    patterns.set(id, pattern);
    this.patterns$.next(patterns);

    return id;
  }

  public updateMetrics(id: string, metrics: Partial<EvolutionMetrics>): void {
    const patterns = this.patterns$.value;
    const pattern = patterns.get(id);

    if (pattern) {
      const updatedMetrics = {
        ...pattern.metrics,
        ...metrics
      };

      const updatedPattern = {
        ...pattern,
        metrics: updatedMetrics,
        history: [
          ...pattern.history.slice(-(this.HISTORY_LIMIT - 1)),
          {
            timestamp: Date.now(),
            metrics: updatedMetrics
          }
        ]
      };

      patterns.set(id, updatedPattern);
      this.patterns$.next(patterns);
    }
  }

  public getEvolutionInsights(id: string): {
    stage: number;
    readyToEvolve: boolean;
    recommendations: string[];
    metrics: EvolutionMetrics;
  } {
    const pattern = this.patterns$.value.get(id);
    if (!pattern) {
      throw new Error(`Pattern ${id} not found`);
    }

    const recommendations: string[] = [];
    const metrics = pattern.metrics;

    if (metrics.strength < 0.5) {
      recommendations.push('Increase pattern usage frequency');
    }
    if (metrics.coherence < 0.5) {
      recommendations.push('Improve pattern consistency');
    }
    if (metrics.stability < 0.5) {
      recommendations.push('Stabilize pattern implementation');
    }
    if (metrics.adaptability < 0.5) {
      recommendations.push('Increase pattern flexibility');
    }

    return {
      stage: pattern.stage,
      readyToEvolve: this.shouldEvolve(pattern),
      recommendations,
      metrics
    };
  }

  public getSystemHealth(): {
    overallStrength: number;
    overallCoherence: number;
    evolvedPatterns: number;
    stablePatterns: number;
  } {
    const patterns = Array.from(this.patterns$.value.values());
    if (patterns.length === 0) {
      return {
        overallStrength: 0,
        overallCoherence: 0,
        evolvedPatterns: 0,
        stablePatterns: 0
      };
    }

    const metrics = patterns.map(p => p.metrics);
    const evolvedPatterns = patterns.filter(p => p.stage > 1).length;
    const stablePatterns = patterns.filter(
      p => p.metrics.stability >= this.STABILITY_THRESHOLD
    ).length;

    return {
      overallStrength: this.calculateAverage(metrics.map(m => m.strength)),
      overallCoherence: this.calculateAverage(metrics.map(m => m.coherence)),
      evolvedPatterns,
      stablePatterns
    };
  }
} 