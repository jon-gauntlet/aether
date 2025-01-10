import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { debounceTime, map, distinctUntilChanged, take } from 'rxjs/operators';
import { EnergySystem, EnergyState } from '../energy/EnergySystem';
import { AutonomicSystem } from './Autonomic';
import { FlowState, FlowMetrics } from '../types/base';
import { ConsciousnessState } from '../types/base';
import { isValidMeasure } from '../types/order';

interface PredictionPattern {
  context: string[];
  signature: string[];
  depth: number;
  strength: number;
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

interface TypeValidationResult {
  isValid: boolean;
  errors: string[];
  path: string[];
  energy: number;
  requiredProbability?: number;
  coherence?: number;
  pattern?: string;
  context?: string[];
}

export class PredictiveValidation {
  private patterns$ = new BehaviorSubject<PredictionPattern[]>([]);
  private typeErrors$ = new BehaviorSubject<TypeValidationResult[]>([]);
  private autonomic: AutonomicSystem;
  private energySystem: EnergySystem;
  private validationContext: string[] = [];

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

  private validateDevelopmentFlow(energy: EnergyState) {
    if (energy.level < 0.3) {
      this.typeErrors$.next([{
        isValid: false,
        errors: ['Energy too low for reliable development'],
        path: ['development', 'energy'],
        energy: energy.level
      }]);
      return;
    }

    // Enhanced pattern-based validation
    const developmentPatterns = this.patterns$.value.filter((p: PredictionPattern) =>
      p.context.some((c: string) => c.includes('development'))
    );

    developmentPatterns.forEach((pattern: PredictionPattern) => {
      const probability = this.estimateSuccessProbability(
        pattern,
        energy,
        this.autonomic.observeAutonomicState()
      );

      // More granular success thresholds
      if (probability < 0.9 && energy.level > 0.8) {
        this.typeErrors$.next([{
          isValid: false,
          errors: ['High energy state requires higher success probability'],
          path: ['development', 'pattern'],
          pattern: pattern.context.join(','),
          energy: energy.level,
          requiredProbability: 0.9
        }]);
      } else if (probability < 0.8 && energy.level > 0.6) {
        this.typeErrors$.next([{
          isValid: false,
          errors: ['Moderate energy state requires higher success probability'],
          path: ['development', 'pattern'],
          pattern: pattern.context.join(','),
          energy: energy.level,
          requiredProbability: 0.8
        }]);
      } else if (probability < 0.7) {
        this.typeErrors$.next([{
          isValid: false,
          errors: ['Development success probability below threshold'],
          path: ['development', 'pattern'],
          pattern: pattern.context.join(','),
          energy: energy.level,
          requiredProbability: 0.7
        }]);
      }
    });

    // Validate pattern coherence
    this.validatePatternCoherence(developmentPatterns, energy);
  }

  private validatePatternCoherence(patterns: PredictionPattern[], energy: EnergyState) {
    const coherenceScore = patterns.reduce((score: number, pattern: PredictionPattern) => {
      const relatedPatterns = patterns.filter((p: PredictionPattern) => 
        p !== pattern && this.patternsAreRelated(p, pattern)
      );

      return score + (relatedPatterns.length / patterns.length);
    }, 0) / patterns.length;

    if (coherenceScore < 0.6) {
      this.typeErrors$.next([{
        isValid: false,
        errors: ['Pattern coherence below threshold'],
        path: ['development', 'coherence'],
        coherence: coherenceScore,
        energy: energy.level
      }]);
    }
  }

  private patternsAreRelated(p1: PredictionPattern, p2: PredictionPattern): boolean {
    return p1.context.some((c: string) => p2.context.includes(c)) ||
           p1.signature.some((s: string) => p2.signature.includes(s));
  }

  private createPattern(context: string[]): PredictionPattern {
    return {
      context,
      signature: [],
      depth: 0,
      strength: 0,
      indicators: {
        energy_trend: [],
        validation_success: [],
        pattern_strength: []
      },
      predictions: {
        likely_issues: [],
        optimal_timing: 0,
        success_probability: 0
      }
    };
  }

  // Enhanced Type Validation
  private async validateFlowMetrics(metrics: FlowMetrics, path: string[]): Promise<TypeValidationResult> {
    const errors: string[] = [];
    const context = [...this.validationContext];
    
    Object.entries(metrics).forEach(([key, value]) => {
      if (!isValidMeasure(value)) {
        errors.push(`Invalid ${key} value: ${value} at ${path.join('.')}`);
        context.push(`invalid_${key}`);
      }
    });

    const energy = await this.energySystem.observeEnergy().pipe(take(1)).toPromise();
    if (!energy) throw new Error('Failed to get energy state');

    return {
      isValid: errors.length === 0,
      errors,
      path,
      context,
      energy: energy.level
    };
  }

  private async validateFlowState(flow: FlowState, path: string[]): Promise<TypeValidationResult> {
    const errors: string[] = [];
    const context = [...this.validationContext];
    
    if (!flow.id) {
      errors.push('Missing flow id');
      context.push('missing_id');
    }
    if (!flow.timestamp) {
      errors.push('Missing timestamp');
      context.push('missing_timestamp');
    }
    if (!['natural', 'guided', 'resonant'].includes(flow.type)) {
      errors.push(`Invalid flow type: ${flow.type}`);
      context.push('invalid_flow_type');
    }

    const metricsValidation = await this.validateFlowMetrics(flow.metrics, [...path, 'metrics']);
    errors.push(...metricsValidation.errors);
    context.push(...(metricsValidation.context || []));

    const energy = await this.energySystem.observeEnergy().pipe(take(1)).toPromise();
    if (!energy) throw new Error('Failed to get energy state');

    return {
      isValid: errors.length === 0,
      errors,
      path,
      context,
      energy: energy.level
    };
  }

  private async validateConsciousnessState(state: any, path: string[]): Promise<TypeValidationResult> {
    const errors: string[] = [];
    
    if (!state || typeof state !== 'object') {
      return {
        isValid: false,
        errors: ['Invalid consciousness state'],
        path,
        energy: 0
      };
    }

    if (!state.flow || typeof state.flow !== 'object') {
      return {
        isValid: false,
        errors: ['Invalid flow state'],
        path,
        energy: 0
      };
    }

    const flowValidation = await this.validateFlowState(state.flow, [...path, 'flow']);
    errors.push(...flowValidation.errors);

    if (!state.spaces || !Array.isArray(state.spaces)) {
      errors.push('Invalid spaces array');
    }

    const energy = await this.energySystem.observeEnergy().pipe(take(1)).toPromise();
    if (!energy) throw new Error('Failed to get energy state');

    return {
      isValid: errors.length === 0,
      errors,
      path,
      energy: energy.level
    };
  }

  // Public API
  public async validateState(state: any) {
    try {
      const typeValidation = await this.validateConsciousnessState(
        state,
        ['consciousness']
      );
      
      if (!typeValidation.isValid) {
        this.typeErrors$.next([typeValidation]);
        console.error('Type validation errors:', typeValidation.errors);
      }
    } catch (error) {
      console.error('Validation error:', error);
      this.typeErrors$.next([{
        isValid: false,
        errors: ['Validation failed: ' + (error as Error).message],
        path: ['consciousness'],
        energy: 0
      }]);
    }
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

  // Enhanced Prediction Methods
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
    return {
      likely_issues: this.predictIssues(
        this.calculateTrend(pattern.indicators.energy_trend),
        this.calculateTrend(pattern.indicators.validation_success),
        this.calculateTrend(pattern.indicators.pattern_strength)
      ),
      optimal_timing: this.calculateOptimalTiming(energy, autonomic, pattern),
      success_probability: this.estimateSuccessProbability(pattern, energy, autonomic)
    };
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    const recent = values.slice(-2);
    return recent[1] - recent[0];
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
    let timing = 1000;

    if (energy.type === 'flow' && energy.level > 0.8) {
      timing = 2000;
    }

    if (pattern.predictions?.success_probability > 0.8) {
      timing *= 1.5;
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

  public predictValidation(context: string[]): Observable<PredictionPattern> {
    return this.patterns$.pipe(
      map(patterns => {
        const matching = patterns.find(p =>
          p.context.some(c => context.includes(c))
        );
        
        if (matching) return matching;

        const newPattern: PredictionPattern = {
          context,
          signature: [],
          depth: 0,
          strength: 0,
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