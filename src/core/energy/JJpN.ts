import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { debounceTime, map, distinctUntilChanged, take } from 'rxjs/operators';
import { EnergySystem, EnhancedEnergyState } from '../energy/EnergySystem';
import { AutonomicSystem } from './Autonomic';
import { FlowState, FlowMetrics, DevelopmentPhase } from '../types/base';
import { ConsciousnessState } from '../types/base';
import { isValidMeasure } from '../types/order';

interface PredictionPattern {
  context: string[];
  signature: string[];
  depth: number;
  strength: number;
  developmentPhase: DevelopmentPhase;
  indicators: {
    energy_trend: number[];
    validation_success: number[];
    pattern_strength: number[];
    focus_retention: number[];
  };
  predictions: {
    likely_issues: string[];
    optimal_timing: number;
    success_probability: number;
    timing: number;
    focus_duration: number;
    recovery_needed: boolean;
  };
}

export interface TypeValidationResult {
  isValid: boolean;
  errors: string[];
  path: string[];
  energy: number;
  requiredProbability?: number;
  coherence?: number;
  pattern?: string;
  context?: string[];
  developmentPhase?: DevelopmentPhase;
  focusMetrics?: {
    intensity: number;
    duration: number;
    quality: number;
  };
}

export class PredictiveValidation {
  private patterns$ = new BehaviorSubject<PredictionPattern[]>([]);
  private typeErrors$ = new BehaviorSubject<TypeValidationResult[]>([]);
  private autonomic: AutonomicSystem;
  private energySystem: EnergySystem;
  private validationContext: string[] = [];

  private readonly FOCUS_THRESHOLD = 0.85;
  private readonly PATTERN_STRENGTH_THRESHOLD = 0.75;
  private readonly MIN_VALIDATION_ENERGY = 0.4;

  constructor(autonomic: AutonomicSystem, energySystem: EnergySystem) {
    this.autonomic = autonomic;
    this.energySystem = energySystem;
    this.initializePrediction();
  }

  private initializePrediction() {
    combineLatest([
      this.energySystem.observeEnergy(),
      this.autonomic.observeAutonomicState()
    ]).pipe(
      debounceTime(1000)
    ).subscribe(([energy, autonomic]) => {
      this.updatePredictions(energy, autonomic);
      
      if (process.env.NODE_ENV === 'development') {
        this.validateState(autonomic);
        this.validateDevelopmentFlow(energy);
      }
    });
  }

  private validateDevelopmentFlow(energy: EnhancedEnergyState) {
    if (energy.current / energy.max < this.MIN_VALIDATION_ENERGY) {
      this.typeErrors$.next([{
        isValid: false,
        errors: ['Energy too low for reliable development'],
        path: ['development', 'energy'],
        energy: energy.current / energy.max,
        developmentPhase: energy.developmentPhase
      }]);
      return;
    }

    // Enhanced pattern-based validation with development phase awareness
    const developmentPatterns = this.patterns$.value.filter((p: PredictionPattern) =>
      p.context.some((c: string) => c.includes('development')) &&
      p.developmentPhase === energy.developmentPhase
    );

    developmentPatterns.forEach((pattern: PredictionPattern) => {
      const probability = this.estimateSuccessProbability(
        pattern,
        energy,
        this.autonomic.observeAutonomicState()
      );

      const focusMetrics = {
        intensity: energy.focusMultiplier,
        duration: energy.sustainedDuration,
        quality: energy.efficiency
      };

      // Phase-specific validation thresholds
      const thresholds = this.getPhaseThresholds(energy.developmentPhase);
      
      if (probability < thresholds.probability) {
        this.typeErrors$.next([{
          isValid: false,
          errors: [`${energy.developmentPhase} phase requires higher success probability`],
          path: ['development', 'pattern'],
          pattern: pattern.context.join(','),
          energy: energy.current / energy.max,
          requiredProbability: thresholds.probability,
          developmentPhase: energy.developmentPhase,
          focusMetrics
        }]);
      }

      // Validate focus metrics
      if (focusMetrics.intensity < thresholds.focus) {
        this.typeErrors$.next([{
          isValid: false,
          errors: [`${energy.developmentPhase} phase requires higher focus intensity`],
          path: ['development', 'focus'],
          energy: energy.current / energy.max,
          developmentPhase: energy.developmentPhase,
          focusMetrics
        }]);
      }
    });

    // Validate pattern coherence with phase awareness
    this.validatePatternCoherence(developmentPatterns, energy);
  }

  private getPhaseThresholds(phase: DevelopmentPhase): {
    probability: number;
    focus: number;
    coherence: number;
  } {
    switch (phase) {
      case 'peak':
        return { probability: 0.9, focus: 1.2, coherence: 0.85 };
      case 'sustained':
        return { probability: 0.8, focus: 1.0, coherence: 0.75 };
      case 'conservation':
        return { probability: 0.7, focus: 0.8, coherence: 0.65 };
      case 'recovery':
        return { probability: 0.6, focus: 0.6, coherence: 0.5 };
    }
  }

  private validatePatternCoherence(patterns: PredictionPattern[], energy: EnhancedEnergyState) {
    const thresholds = this.getPhaseThresholds(energy.developmentPhase);
    
    const coherenceScore = patterns.reduce((score: number, pattern: PredictionPattern) => {
      const relatedPatterns = patterns.filter((p: PredictionPattern) => 
        p !== pattern && this.patternsAreRelated(p, pattern)
      );

      const phaseAlignment = relatedPatterns.filter(p => 
        p.developmentPhase === pattern.developmentPhase
      ).length / Math.max(1, relatedPatterns.length);

      return score + (relatedPatterns.length / patterns.length) * phaseAlignment;
    }, 0) / patterns.length;

    if (coherenceScore < thresholds.coherence) {
      this.typeErrors$.next([{
        isValid: false,
        errors: [`Pattern coherence below ${energy.developmentPhase} phase threshold`],
        path: ['development', 'coherence'],
        coherence: coherenceScore,
        energy: energy.current / energy.max,
        developmentPhase: energy.developmentPhase
      }]);
    }
  }

  private patternsAreRelated(p1: PredictionPattern, p2: PredictionPattern): boolean {
    return p1.context.some((c: string) => p2.context.includes(c)) ||
           p1.signature.some((s: string) => p2.signature.includes(s)) ||
           p1.developmentPhase === p2.developmentPhase;
  }

  private createPattern(context: string[], phase: DevelopmentPhase): PredictionPattern {
    return {
      context,
      signature: [],
      depth: 0,
      strength: 0,
      developmentPhase: phase,
      indicators: {
        energy_trend: [],
        validation_success: [],
        pattern_strength: [],
        focus_retention: []
      },
      predictions: {
        likely_issues: [],
        optimal_timing: 0,
        success_probability: 0,
        timing: 0,
        focus_duration: 0,
        recovery_needed: false
      }
    };
  }

  private async updatePredictions(energy: EnhancedEnergyState, autonomic: any) {
    const patterns = this.patterns$.value;
    const updated = await Promise.all(patterns.map(async pattern => {
      const predictions = await this.calculatePredictions(pattern, energy, autonomic);
      return { ...pattern, predictions };
    }));

    this.patterns$.next(updated);
  }

  private async calculatePredictions(
    pattern: PredictionPattern,
    energy: EnhancedEnergyState,
    autonomic: any
  ): Promise<PredictionPattern['predictions']> {
    const energyTrend = this.calculateTrend(pattern.indicators.energy_trend);
    const successTrend = this.calculateTrend(pattern.indicators.validation_success);
    const strengthTrend = this.calculateTrend(pattern.indicators.pattern_strength);
    const focusTrend = this.calculateTrend(pattern.indicators.focus_retention);

    const likelyIssues = this.predictIssues(energyTrend, successTrend, strengthTrend, focusTrend);
    const optimalTiming = this.calculateOptimalTiming(energy, autonomic, pattern);
    const probability = this.estimateSuccessProbability(pattern, energy, autonomic);
    const focusDuration = this.estimateFocusDuration(pattern, energy);
    const recoveryNeeded = this.isRecoveryNeeded(pattern, energy);

    return {
      likely_issues: likelyIssues,
      optimal_timing: optimalTiming,
      success_probability: probability,
      timing: Date.now(),
      focus_duration: focusDuration,
      recovery_needed: recoveryNeeded
    };
  }

  private estimateFocusDuration(pattern: PredictionPattern, energy: EnhancedEnergyState): number {
    const baseDuration = pattern.indicators.focus_retention.reduce((acc, val) => acc + val, 0) / 
                        Math.max(1, pattern.indicators.focus_retention.length);
    
    return Math.round(baseDuration * energy.focusMultiplier);
  }

  private isRecoveryNeeded(pattern: PredictionPattern, energy: EnhancedEnergyState): boolean {
    return energy.current / energy.max < this.MIN_VALIDATION_ENERGY ||
           pattern.indicators.energy_trend.slice(-3).every(v => v < 0) ||
           energy.developmentPhase === 'recovery';
  }

  public async validateState(state: any) {
    if (!state || typeof state !== 'object') {
      this.typeErrors$.next([{
        isValid: false,
        errors: ['Invalid state object'],
        path: ['state'],
        energy: 0
      }]);
      return;
    }

    const energy = await this.energySystem.observeEnergy().pipe(take(1)).toPromise();
    if (!energy) throw new Error('Failed to get energy state');

    const result = await this.validateConsciousnessState(state, ['consciousness']);
    result.developmentPhase = energy.developmentPhase;
    
    this.typeErrors$.next([result]);
  }

  public setValidationContext(context: string[]) {
    this.validationContext = context;
  }

  public getValidationPatterns(): Observable<PredictionPattern[]> {
    return this.patterns$.asObservable();
  }

  public observeTypeErrors(): Observable<TypeValidationResult[]> {
    return this.typeErrors$.asObservable();
  }

  public getDevelopmentInsights(): Observable<{
    optimalPatterns: PredictionPattern[];
    sustainableHours: number;
    recoveryRecommendations: string[];
  }> {
    return combineLatest([
      this.patterns$,
      this.energySystem.getDevelopmentMetrics()
    ]).pipe(
      map(([patterns, metrics]) => {
        const optimalPatterns = patterns
          .filter(p => p.predictions.success_probability > this.PATTERN_STRENGTH_THRESHOLD)
          .sort((a, b) => b.strength - a.strength);

        const sustainableHours = metrics.sustainedHours;
        
        const recoveryRecommendations = this.generateRecoveryRecommendations(
          patterns,
          metrics
        );

        return {
          optimalPatterns,
          sustainableHours,
          recoveryRecommendations
        };
      })
    );
  }

  private generateRecoveryRecommendations(
    patterns: PredictionPattern[],
    metrics: { sustainedHours: number; peakPerformance: number; recoveryEfficiency: number }
  ): string[] {
    const recommendations: string[] = [];

    if (metrics.sustainedHours > 12) {
      recommendations.push('Consider a longer recovery period to maintain peak performance');
    }
    
    if (metrics.peakPerformance < 1.0) {
      recommendations.push('Focus quality declining - schedule strategic breaks');
    }

    if (metrics.recoveryEfficiency < 0.8) {
      recommendations.push('Recovery efficiency low - optimize rest periods');
    }

    const riskyPatterns = patterns.filter(p => 
      p.predictions.recovery_needed && p.strength > this.PATTERN_STRENGTH_THRESHOLD
    );

    if (riskyPatterns.length > 0) {
      recommendations.push('Some high-strength patterns require recovery attention');
    }

    return recommendations;
  }
} 