import { Observable, BehaviorSubject, combineLatest, firstValueFrom } from 'rxjs';
import { debounceTime, map, distinctUntilChanged, take } from 'rxjs/operators';
import { EnergySystem, EnhancedEnergyState } from '../energy/EnergySystem';
import { AutonomicSystem, AutonomicState } from './Autonomic';
import { 
  FlowState, 
  FlowMetrics, 
  DevelopmentPhase,
  ConsciousnessState,
  SystemState,
  IntegrationMetrics 
} from '../types/base';

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
    natural_timing: {
      golden_ratio: number;
      silver_ratio: number;
      bronze_ratio: number;
    };
    flow_alignment: number;
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
  private readonly PATTERN_STRENGTH_THRESHOLD = 0.75;
  private readonly MIN_VALIDATION_ENERGY = 0.4;
  private readonly NATURAL_RATIOS = {
    GOLDEN: 0.618033988749895,
    SILVER: 0.414213562373095,
    BRONZE: 0.302775637731995
  };

  constructor(
    private readonly autonomic: AutonomicSystem,
    private readonly energySystem: EnergySystem
  ) {
    this.initializePrediction().catch(error => {
      console.error('Failed to initialize prediction system:', error);
    });
  }

  private async initializePrediction() {
    const energy = await firstValueFrom(this.energySystem.observeEnergy());
    if (!energy) {
      console.error('Failed to initialize prediction system - no energy state');
      return;
    }

    const autonomicState = await firstValueFrom(this.autonomic.observeState());
    if (!autonomicState) {
      console.error('Failed to initialize prediction system - no autonomic state');
      return;
    }

    this.patterns$.next([this.createPattern(['initialization'], energy.developmentPhase)]);

    // Set up continuous monitoring
    combineLatest([
      this.energySystem.observeEnergy(),
      this.autonomic.observeState()
    ]).pipe(
      debounceTime(1000)
    ).subscribe(async ([energy, autonomicState]) => {
      if (energy && autonomicState) {
        await this.updatePredictions(energy, this.autonomic);
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
        recovery_needed: false,
        natural_timing: {
          golden_ratio: 0,
          silver_ratio: 0,
          bronze_ratio: 0
        },
        flow_alignment: 0
      }
    };
  }

  private async updatePredictions(energy: EnhancedEnergyState, autonomic: AutonomicSystem) {
    const patterns = this.patterns$.getValue();
    const updatedPatterns = await Promise.all(patterns.map(async pattern => {
      const predictions = await this.calculatePredictions(pattern, energy, autonomic);
      return {
        ...pattern,
        predictions
      };
    }));
    
    this.patterns$.next(updatedPatterns);
  }

  private async calculatePredictions(
    pattern: PredictionPattern,
    energy: EnhancedEnergyState,
    autonomic: AutonomicSystem
  ): Promise<PredictionPattern['predictions']> {
    const likelyIssues = this.predictIssues(
      pattern.indicators.energy_trend[0],
      pattern.indicators.validation_success[0],
      pattern.indicators.pattern_strength[0],
      pattern.indicators.focus_retention[0]
    );

    const optimalTiming = await this.calculateOptimalTiming(energy, autonomic, pattern);
    const successProbability = await this.estimateSuccessProbability(pattern, energy, autonomic);
    const focusDuration = this.estimateFocusDuration(pattern, energy);
    const recoveryNeeded = this.isRecoveryNeeded(pattern, energy);
    const naturalTiming = this.calculateNaturalTiming(pattern, energy);
    const flowAlignment = this.calculateFlowAlignment(pattern, energy);

    return {
      likely_issues: likelyIssues,
      optimal_timing: optimalTiming,
      success_probability: successProbability,
      timing: optimalTiming,
      focus_duration: focusDuration,
      recovery_needed: recoveryNeeded,
      natural_timing: naturalTiming,
      flow_alignment: flowAlignment
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

  public async validateState(state: ConsciousnessState | undefined): Promise<TypeValidationResult> {
    if (!state) {
      return {
        isValid: false,
        errors: ['State is undefined'],
        path: [],
        energy: 0
      };
    }

    const flowValidation = await this.validateFlowState(state.flow, ['flow']);
    if (!flowValidation.isValid) {
      return flowValidation;
    }

    if (state.metrics) {
      const fullMetrics = {
        ...state.metrics,
        harmony: state.metrics.coherence,
        presence: state.flow.metrics.presence,
        clarity: state.flow.metrics.clarity || 0,
        resonance: state.flow.metrics.resonance || 0,
        alignment: state.flow.metrics.quality
      };
      
      const metricsValidation = await this.validateSystemMetrics(fullMetrics, ['metrics']);
      if (!metricsValidation.isValid) {
        return metricsValidation;
      }
    }

    return {
      isValid: true,
      errors: [],
      path: [],
      energy: state.flow.metrics.energy,
      coherence: state.metrics?.coherence || state.flow.metrics.quality,
      pattern: 'consciousness',
      context: state.spaces || [],
      focusMetrics: {
        intensity: state.flow.metrics.intensity,
        duration: 0,
        quality: state.flow.metrics.quality
      }
    };
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

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    const recent = values.slice(-2);
    return recent[1] - recent[0];
  }

  private predictIssues(
    energyTrend: number,
    successTrend: number,
    strengthTrend: number,
    focusTrend: number
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

    if (focusTrend < -0.1) {
      issues.push('focus_degrading');
    }

    return issues;
  }

  private async calculateOptimalTiming(
    energy: EnhancedEnergyState,
    autonomic: AutonomicSystem,
    pattern: PredictionPattern
  ): Promise<number> {
    try {
      const autonomicState = await firstValueFrom(autonomic.observeState());
      if (!autonomicState) {
        return pattern.predictions.timing; // Use existing timing if no state
      }
      return pattern.predictions.timing * autonomicState.flow.quality;
    } catch (error) {
      console.error('Error calculating optimal timing:', error);
      return pattern.predictions.timing; // Use existing timing on error
    }
  }

  private async estimateSuccessProbability(
    pattern: PredictionPattern,
    energy: EnhancedEnergyState,
    autonomic: AutonomicSystem
  ): Promise<number> {
    try {
      const autonomicState = await firstValueFrom(autonomic.observeState());
      if (!autonomicState) {
        return 0.5; // Default to neutral if no state
      }
      const probability = (pattern.strength * energy.current * autonomicState.flow.quality) / 3;
      return Math.min(1, probability);
    } catch (error) {
      console.error('Error estimating success probability:', error);
      return 0.5; // Default to neutral probability on error
    }
  }

  private async validateFlowMetrics(metrics: FlowMetrics, path: string[]): Promise<TypeValidationResult> {
    if (!metrics || typeof metrics !== 'object') {
      return {
        isValid: false,
        errors: ['Invalid flow metrics'],
        path,
        energy: 0
      };
    }

    const validations = [
      this.validateMetricRange(metrics.depth, 'depth', path),
      this.validateMetricRange(metrics.clarity, 'clarity', path),
      this.validateMetricRange(metrics.stability, 'stability', path),
      this.validateMetricRange(metrics.focus, 'focus', path),
      this.validateMetricRange(metrics.energy, 'energy', path),
      this.validateMetricRange(metrics.quality, 'quality', path)
    ];

    const errors = validations.filter(v => !v.isValid).map(v => v.errors[0]);

    return {
      isValid: errors.length === 0,
      errors,
      path,
      energy: metrics.energy
    };
  }

  private async validateFlowState(flow: FlowState, path: string[]): Promise<TypeValidationResult> {
    if (!flow || typeof flow !== 'object') {
      return {
        isValid: false,
        errors: ['Invalid flow state'],
        path,
        energy: 0
      };
    }

    const metricsValidation = await this.validateFlowMetrics(flow.metrics, [...path, 'metrics']);
    if (!metricsValidation.isValid) {
      return metricsValidation;
    }

    const energy = await firstValueFrom(this.energySystem.observeEnergy());
    if (!energy) {
      return {
        isValid: false,
        errors: ['Failed to get energy state'],
        path,
        energy: 0
      };
    }

    return {
      isValid: true,
      errors: [],
      path,
      energy: energy.current / energy.max,
      developmentPhase: energy.developmentPhase
    };
  }

  private async validateSystemMetrics(
    metrics: {
      coherence: number;
      stability: number;
      quality: number;
      harmony: number;
      presence: number;
      clarity: number;
      resonance: number;
      alignment: number;
    },
    path: string[]
  ): Promise<TypeValidationResult> {
    const validations = [
      this.validateMetricRange(metrics.coherence, 'coherence', path),
      this.validateMetricRange(metrics.stability, 'stability', path),
      this.validateMetricRange(metrics.quality, 'quality', path),
      this.validateMetricRange(metrics.harmony, 'harmony', path),
      this.validateMetricRange(metrics.presence, 'presence', path),
      this.validateMetricRange(metrics.clarity, 'clarity', path),
      this.validateMetricRange(metrics.resonance, 'resonance', path),
      this.validateMetricRange(metrics.alignment, 'alignment', path)
    ];

    const errors = validations.filter(v => !v.isValid).map(v => v.errors[0]);

    return {
      isValid: errors.length === 0,
      errors,
      path,
      energy: 1,
      coherence: metrics.coherence
    };
  }

  private validateMetricRange(
    value: number | undefined,
    name: string,
    path: string[]
  ): TypeValidationResult {
    const isValid = typeof value === 'number' && value >= 0 && value <= 1;
    return {
      isValid,
      errors: isValid ? [] : [`${name} must be between 0 and 1`],
      path: [...path, name],
      energy: 1
    };
  }

  private calculateNaturalTiming(pattern: PredictionPattern, energy: EnhancedEnergyState): {
    golden_ratio: number;
    silver_ratio: number;
    bronze_ratio: number;
  } {
    const baseTime = pattern.predictions.optimal_timing;
    return {
      golden_ratio: baseTime * this.NATURAL_RATIOS.GOLDEN,
      silver_ratio: baseTime * this.NATURAL_RATIOS.SILVER,
      bronze_ratio: baseTime * this.NATURAL_RATIOS.BRONZE
    };
  }

  private calculateFlowAlignment(pattern: PredictionPattern, energy: EnhancedEnergyState): number {
    const naturalTiming = this.calculateNaturalTiming(pattern, energy);
    const currentTiming = pattern.predictions.timing;
    
    const goldenDiff = Math.abs(currentTiming - naturalTiming.golden_ratio);
    const silverDiff = Math.abs(currentTiming - naturalTiming.silver_ratio);
    const bronzeDiff = Math.abs(currentTiming - naturalTiming.bronze_ratio);
    
    const minDiff = Math.min(goldenDiff, silverDiff, bronzeDiff);
    const maxPossibleDiff = Math.max(
      naturalTiming.golden_ratio,
      naturalTiming.silver_ratio,
      naturalTiming.bronze_ratio
    );
    
    return 1 - (minDiff / maxPossibleDiff);
  }

  private async validateConsciousnessState(state: ConsciousnessState, path: string[]): Promise<TypeValidationResult> {
    const flowValidation = await this.validateFlowState(state.flow, [...path, 'flow']);
    if (!flowValidation.isValid) {
      return flowValidation;
    }

    if (state.metrics) {
      const fullMetrics = {
        ...state.metrics,
        harmony: state.metrics.coherence,
        presence: state.flow.metrics.presence,
        clarity: state.flow.metrics.clarity || 0,
        resonance: state.flow.metrics.resonance || 0,
        alignment: state.flow.metrics.quality
      };
      
      const metricsValidation = await this.validateSystemMetrics(fullMetrics, [...path, 'metrics']);
      if (!metricsValidation.isValid) {
        return metricsValidation;
      }
    }

    const energy = await firstValueFrom(this.energySystem.observeEnergy());
    if (!energy) {
      return {
        isValid: false,
        errors: ['Failed to get energy state'],
        path,
        energy: 0
      };
    }

    return {
      isValid: true,
      errors: [],
      path,
      energy: energy.current / energy.max,
      coherence: state.metrics?.coherence || state.flow.metrics.quality,
      pattern: 'consciousness',
      context: state.spaces || [],
      focusMetrics: {
        intensity: state.flow.metrics.intensity,
        duration: 0,
        quality: state.flow.metrics.quality
      }
    };
  }
} 