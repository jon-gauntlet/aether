import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, filter, debounceTime } from 'rxjs/operators';
import { AutonomicSystem } from './Autonomic';
import { EnergySystem, EnergyState } from '../energy/EnergySystem';

interface PredictionPattern {
  context: string[];
  indicators: {
    energy_trend: number[];
    validation_success: number[];
    pattern_strength: number[];
  };
  predictions: {
    likely_issues: string[];
    optimal_timing: number;
    success_probability: number;
  };
}

export class PredictiveValidation {
  private patterns$ = new BehaviorSubject<PredictionPattern[]>([]);
  private autonomic: AutonomicSystem;
  private energySystem: EnergySystem;

  constructor(autonomic: AutonomicSystem, energySystem: EnergySystem) {
    this.autonomic = autonomic;
    this.energySystem = energySystem;
    this.initializePrediction();
  }

  private initializePrediction() {
    // Combine energy and autonomic observations
    combineLatest([
      this.energySystem.observeEnergy(),
      this.autonomic.observeAutonomicState()
    ]).pipe(
      debounceTime(1000)
    ).subscribe(([energy, autonomic]) => {
      this.updatePredictions(energy, autonomic);
    });
  }

  private async updatePredictions(energy: EnergyState, autonomic: any) {
    const patterns = this.patterns$.value;
    
    // Update existing patterns
    const updated = await Promise.all(
      patterns.map(async pattern => ({
        ...pattern,
        indicators: {
          energy_trend: [...pattern.indicators.energy_trend.slice(-4), energy.level],
          validation_success: [...pattern.indicators.validation_success],
          pattern_strength: [...pattern.indicators.pattern_strength, autonomic.confidence]
        },
        predictions: await this.calculatePredictions(pattern, energy, autonomic)
      }))
    );

    this.patterns$.next(updated);
  }

  private async calculatePredictions(
    pattern: PredictionPattern,
    energy: EnergyState,
    autonomic: any
  ): Promise<PredictionPattern['predictions']> {
    // Analyze trends
    const energyTrend = this.analyzeTrend(pattern.indicators.energy_trend);
    const successTrend = this.analyzeTrend(pattern.indicators.validation_success);
    const strengthTrend = this.analyzeTrend(pattern.indicators.pattern_strength);

    // Predict likely issues
    const likelyIssues = this.predictIssues(
      energyTrend,
      successTrend,
      strengthTrend
    );

    // Calculate optimal timing
    const optimalTiming = this.calculateOptimalTiming(
      energy,
      autonomic,
      pattern
    );

    // Estimate success probability
    const successProbability = this.estimateSuccessProbability(
      pattern,
      energy,
      autonomic
    );

    return {
      likely_issues: likelyIssues,
      optimal_timing: optimalTiming,
      success_probability: successProbability
    };
  }

  private analyzeTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const recent = values.slice(-3);
    const changes = recent.slice(1).map((val, i) => val - recent[i]);
    return changes.reduce((sum, change) => sum + change, 0) / changes.length;
  }

  private predictIssues(
    energyTrend: number,
    successTrend: number,
    strengthTrend: number
  ): string[] {
    const issues: string[] = [];

    if (energyTrend < -0.1) {
      issues.push('energy_declining');
    }

    if (successTrend < -0.1) {
      issues.push('validation_degrading');
    }

    if (strengthTrend < -0.1) {
      issues.push('pattern_weakening');
    }

    return issues;
  }

  private calculateOptimalTiming(
    energy: EnergyState,
    autonomic: any,
    pattern: PredictionPattern
  ): number {
    // Base timing on energy levels
    let timing = 1000; // Default 1 second

    if (energy.type === 'flow' && energy.level > 0.8) {
      timing = 2000; // Reduce frequency in flow
    }

    if (pattern.predictions?.success_probability > 0.8) {
      timing *= 1.5; // Further reduce if highly confident
    }

    return timing;
  }

  private estimateSuccessProbability(
    pattern: PredictionPattern,
    energy: EnergyState,
    autonomic: any
  ): number {
    const energyFactor = energy.level * 0.3;
    const successFactor = (pattern.indicators.validation_success.slice(-1)[0] || 0.5) * 0.4;
    const confidenceFactor = autonomic.confidence * 0.3;

    return energyFactor + successFactor + confidenceFactor;
  }

  // Public API
  public predictValidation(context: string[]): Observable<PredictionPattern> {
    return this.patterns$.pipe(
      map(patterns => {
        const matching = patterns.find(p =>
          p.context.some(c => context.includes(c))
        );
        
        if (matching) return matching;

        // Create new pattern if none exists
        const newPattern: PredictionPattern = {
          context,
          indicators: {
            energy_trend: [0.5],
            validation_success: [0.5],
            pattern_strength: [0.5]
          },
          predictions: {
            likely_issues: [],
            optimal_timing: 1000,
            success_probability: 0.5
          }
        };

        this.patterns$.next([...patterns, newPattern]);
        return newPattern;
      })
    );
  }

  public getOptimalTiming(context: string[]): Observable<number> {
    return this.predictValidation(context).pipe(
      map(pattern => pattern.predictions.optimal_timing)
    );
  }

  public getPredictedIssues(context: string[]): Observable<string[]> {
    return this.predictValidation(context).pipe(
      map(pattern => pattern.predictions.likely_issues)
    );
  }

  public getSuccessProbability(context: string[]): Observable<number> {
    return this.predictValidation(context).pipe(
      map(pattern => pattern.predictions.success_probability)
    );
  }
} 