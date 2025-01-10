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
  statistics: {
    mean: number;
    variance: number;
    skewness: number;
    kurtosis: number;
    trend: number;
  };
}

export interface PatternLifecycle {
  stage: 'emerging' | 'growing' | 'stable' | 'adapting' | 'declining';
  age: number;
  transitions: {
    timestamp: number;
    from: PatternLifecycle['stage'];
    to: PatternLifecycle['stage'];
    trigger: string;
  }[];
  predictions: {
    nextStage: PatternLifecycle['stage'];
    confidence: number;
    timeframe: number;
  };
  vitality: {
    current: number;
    trend: number;
    stability: number;
  };
}

export interface PatternState {
  id: string;
  type: 'structural' | 'behavioral' | 'cognitive';
  stage: number;
  metrics: EvolutionMetrics;
  lifecycle: PatternLifecycle;
  history: {
    timestamp: number;
    metrics: EvolutionMetrics;
    lifecycle: PatternLifecycle;
  }[];
}

export class PatternEvolution {
  private patterns$ = new BehaviorSubject<Map<string, PatternState>>(new Map());
  private readonly EVOLUTION_THRESHOLD = 0.8;
  private readonly STABILITY_THRESHOLD = 0.7;
  private readonly HISTORY_LIMIT = 100;
  private readonly LIFECYCLE_ANALYSIS_WINDOW = 20;

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

        // Update lifecycle regardless of evolution
        const updatedLifecycle = this.updateLifecycle(pattern);
        if (updatedLifecycle !== pattern.lifecycle) {
          patterns.set(id, {
            ...pattern,
            lifecycle: updatedLifecycle
          });
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
    const avgStrength = this.calculateMean(recentMetrics.map(m => m.strength));
    const avgStability = this.calculateMean(recentMetrics.map(m => m.stability));
    const trend = this.calculateTrend(recentMetrics.map(m => m.strength));

    return avgStrength >= this.EVOLUTION_THRESHOLD &&
           avgStability >= this.STABILITY_THRESHOLD &&
           trend > 0;
  }

  private evolvePattern(pattern: PatternState): PatternState {
    const newStage = Math.min(10, pattern.stage + 1);
    const evolutionBonus = 0.1;
    const currentStats = pattern.metrics.statistics;

    // Calculate new statistics
    const newStats = this.calculateStatistics(
      pattern.history.map(h => h.metrics.strength)
    );

    return {
      ...pattern,
      stage: newStage,
      metrics: {
        ...pattern.metrics,
        strength: Math.min(1, pattern.metrics.strength + evolutionBonus),
        adaptability: Math.min(1, pattern.metrics.adaptability + evolutionBonus),
        statistics: {
          ...currentStats,
          ...newStats,
          trend: this.calculateTrend(pattern.history.map(h => h.metrics.strength))
        }
      }
    };
  }

  private updateLifecycle(pattern: PatternState): PatternLifecycle {
    const recentHistory = pattern.history.slice(-this.LIFECYCLE_ANALYSIS_WINDOW);
    if (recentHistory.length < 2) return pattern.lifecycle;

    const metrics = recentHistory.map(h => h.metrics);
    const currentVitality = this.calculateVitality(metrics);
    const vitalityTrend = this.calculateTrend(
      recentHistory.map(h => this.calculateVitality([h.metrics]))
    );

    const newStage = this.determineLifecycleStage(
      pattern.lifecycle.stage,
      currentVitality,
      vitalityTrend,
      pattern.metrics.statistics
    );

    if (newStage !== pattern.lifecycle.stage) {
      return {
        ...pattern.lifecycle,
        stage: newStage,
        transitions: [
          ...pattern.lifecycle.transitions,
          {
            timestamp: Date.now(),
            from: pattern.lifecycle.stage,
            to: newStage,
            trigger: this.determineTransitionTrigger(
              pattern.lifecycle.stage,
              newStage,
              pattern.metrics
            )
          }
        ],
        predictions: this.predictNextStage(newStage, pattern.metrics, vitalityTrend),
        vitality: {
          current: currentVitality,
          trend: vitalityTrend,
          stability: this.calculateVitalityStability(recentHistory)
        }
      };
    }

    return {
      ...pattern.lifecycle,
      age: pattern.lifecycle.age + 1,
      predictions: this.predictNextStage(
        pattern.lifecycle.stage,
        pattern.metrics,
        vitalityTrend
      ),
      vitality: {
        current: currentVitality,
        trend: vitalityTrend,
        stability: this.calculateVitalityStability(recentHistory)
      }
    };
  }

  private calculateStatistics(values: number[]): Partial<EvolutionMetrics['statistics']> {
    const n = values.length;
    if (n < 2) return {};

    const mean = this.calculateMean(values);
    const variance = this.calculateVariance(values, mean);
    const stdDev = Math.sqrt(variance);

    // Calculate higher moments
    const moments = values.reduce((acc, val) => {
      const diff = val - mean;
      const diff3 = diff * diff * diff;
      const diff4 = diff3 * diff;
      return {
        m3: acc.m3 + diff3,
        m4: acc.m4 + diff4
      };
    }, { m3: 0, m4: 0 });

    const skewness = (moments.m3 / n) / Math.pow(stdDev, 3);
    const kurtosis = (moments.m4 / n) / Math.pow(variance, 2);

    return {
      mean,
      variance,
      skewness,
      kurtosis
    };
  }

  private calculateMean(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateVariance(values: number[], mean?: number): number {
    const m = mean ?? this.calculateMean(values);
    return values.reduce((sum, val) => sum + Math.pow(val - m, 2), 0) / values.length;
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;

    // Simple linear regression
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;

    const sumX = x.reduce((a, b) => a + b);
    const sumY = y.reduce((a, b) => a + b);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  private calculateVitality(metrics: EvolutionMetrics[]): number {
    return metrics.reduce((vitality, m) => 
      vitality + (
        m.strength * 0.3 +
        m.coherence * 0.2 +
        m.resonance * 0.2 +
        m.stability * 0.2 +
        m.adaptability * 0.1
      ), 0
    ) / metrics.length;
  }

  private calculateVitalityStability(history: PatternState['history']): number {
    const vitalities = history.map(h => this.calculateVitality([h.metrics]));
    return 1 - this.calculateVariance(vitalities) * 10; // Scale for meaningful range
  }

  private determineLifecycleStage(
    currentStage: PatternLifecycle['stage'],
    vitality: number,
    vitalityTrend: number,
    stats: EvolutionMetrics['statistics']
  ): PatternLifecycle['stage'] {
    if (vitality < 0.3 && vitalityTrend < 0) return 'declining';
    if (vitality < 0.5 && stats.variance > 0.1) return 'adapting';
    if (vitality >= 0.7 && stats.variance < 0.05) return 'stable';
    if (vitality >= 0.5 && vitalityTrend > 0) return 'growing';
    return 'emerging';
  }

  private determineTransitionTrigger(
    from: PatternLifecycle['stage'],
    to: PatternLifecycle['stage'],
    metrics: EvolutionMetrics
  ): string {
    const triggers: Record<PatternLifecycle['stage'], Partial<Record<PatternLifecycle['stage'], string>>> = {
      emerging: {
        growing: 'increased_strength',
        declining: 'early_failure'
      },
      growing: {
        stable: 'achieved_stability',
        adapting: 'environmental_change',
        declining: 'growth_stalled'
      },
      stable: {
        adapting: 'new_requirements',
        declining: 'relevance_loss'
      },
      adapting: {
        stable: 'successful_adaptation',
        declining: 'failed_adaptation'
      },
      declining: {
        adapting: 'renewal_attempt',
        emerging: 'complete_reinvention'
      }
    };

    return triggers[from]?.[to] || 'natural_evolution';
  }

  private predictNextStage(
    currentStage: PatternLifecycle['stage'],
    metrics: EvolutionMetrics,
    vitalityTrend: number
  ): PatternLifecycle['predictions'] {
    const predictions: Record<PatternLifecycle['stage'], {
      nextStage: PatternLifecycle['stage'];
      confidence: number;
      timeframe: number;
    }> = {
      emerging: {
        nextStage: vitalityTrend > 0 ? 'growing' : 'declining',
        confidence: Math.abs(vitalityTrend) * 0.7,
        timeframe: 5000
      },
      growing: {
        nextStage: metrics.stability > 0.7 ? 'stable' : 'adapting',
        confidence: metrics.stability * 0.8,
        timeframe: 10000
      },
      stable: {
        nextStage: metrics.adaptability < 0.5 ? 'adapting' : 'stable',
        confidence: (1 - metrics.adaptability) * 0.9,
        timeframe: 15000
      },
      adapting: {
        nextStage: vitalityTrend > 0 ? 'stable' : 'declining',
        confidence: Math.abs(vitalityTrend) * 0.6,
        timeframe: 8000
      },
      declining: {
        nextStage: metrics.adaptability > 0.7 ? 'adapting' : 'emerging',
        confidence: metrics.adaptability * 0.5,
        timeframe: 12000
      }
    };

    return predictions[currentStage];
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
        adaptability: initialMetrics.adaptability ?? 0.1,
        statistics: {
          mean: 0.1,
          variance: 0,
          skewness: 0,
          kurtosis: 0,
          trend: 0
        }
      },
      lifecycle: {
        stage: 'emerging',
        age: 0,
        transitions: [],
        predictions: {
          nextStage: 'growing',
          confidence: 0.5,
          timeframe: 5000
        },
        vitality: {
          current: 0.1,
          trend: 0,
          stability: 1.0
        }
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
            metrics: updatedMetrics,
            lifecycle: pattern.lifecycle
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
    lifecycle: {
      current: PatternLifecycle['stage'];
      age: number;
      vitality: PatternLifecycle['vitality'];
      predictions: PatternLifecycle['predictions'];
      recentTransitions: PatternLifecycle['transitions'];
    };
    statistics: EvolutionMetrics['statistics'];
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

    // Add lifecycle-specific recommendations
    switch (pattern.lifecycle.stage) {
      case 'emerging':
        if (pattern.lifecycle.vitality.trend <= 0) {
          recommendations.push('Strengthen core pattern elements');
        }
        break;
      case 'growing':
        if (metrics.stability < 0.7) {
          recommendations.push('Focus on pattern stability');
        }
        break;
      case 'adapting':
        if (pattern.lifecycle.vitality.stability < 0.5) {
          recommendations.push('Stabilize adaptation process');
        }
        break;
      case 'declining':
        if (metrics.adaptability < 0.6) {
          recommendations.push('Consider pattern rejuvenation');
        }
        break;
    }

    return {
      stage: pattern.stage,
      readyToEvolve: this.shouldEvolve(pattern),
      recommendations,
      metrics,
      lifecycle: {
        current: pattern.lifecycle.stage,
        age: pattern.lifecycle.age,
        vitality: pattern.lifecycle.vitality,
        predictions: pattern.lifecycle.predictions,
        recentTransitions: pattern.lifecycle.transitions.slice(-3)
      },
      statistics: pattern.metrics.statistics
    };
  }

  public getSystemHealth(): {
    overallStrength: number;
    overallCoherence: number;
    evolvedPatterns: number;
    stablePatterns: number;
    lifecycleDistribution: Record<PatternLifecycle['stage'], number>;
    systemVitality: {
      current: number;
      trend: number;
      stability: number;
    };
  } {
    const patterns = Array.from(this.patterns$.value.values());
    if (patterns.length === 0) {
      return {
        overallStrength: 0,
        overallCoherence: 0,
        evolvedPatterns: 0,
        stablePatterns: 0,
        lifecycleDistribution: {
          emerging: 0,
          growing: 0,
          stable: 0,
          adapting: 0,
          declining: 0
        },
        systemVitality: {
          current: 0,
          trend: 0,
          stability: 0
        }
      };
    }

    const metrics = patterns.map(p => p.metrics);
    const evolvedPatterns = patterns.filter(p => p.stage > 1).length;
    const stablePatterns = patterns.filter(
      p => p.metrics.stability >= this.STABILITY_THRESHOLD
    ).length;

    // Calculate lifecycle distribution
    const distribution = patterns.reduce((acc, p) => {
      acc[p.lifecycle.stage]++;
      return acc;
    }, {
      emerging: 0,
      growing: 0,
      stable: 0,
      adapting: 0,
      declining: 0
    });

    // Calculate system vitality
    const vitalities = patterns.map(p => p.lifecycle.vitality);
    const currentVitality = this.calculateMean(vitalities.map(v => v.current));
    const vitalityTrend = this.calculateMean(vitalities.map(v => v.trend));
    const vitalityStability = this.calculateMean(vitalities.map(v => v.stability));

    return {
      overallStrength: this.calculateMean(metrics.map(m => m.strength)),
      overallCoherence: this.calculateMean(metrics.map(m => m.coherence)),
      evolvedPatterns,
      stablePatterns,
      lifecycleDistribution: distribution,
      systemVitality: {
        current: currentVitality,
        trend: vitalityTrend,
        stability: vitalityStability
      }
    };
  }
} 