import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, filter, debounceTime } from 'rxjs/operators';
import { AutonomicSystem } from './Autonomic';
import { EnergySystem, EnergyState } from '../energy/EnergySystem';
import { FlowState, FlowMetrics, ConsciousnessState } from '../types/base';
import { isValidMeasure } from '../types/order';

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

interface TypeValidationResult {
  isValid: boolean;
  errors: string[];
  path: string[];
  context?: string[];
  pattern?: string;
  energy?: number;
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

  // AI-First Development Integration
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

    // Check if we're in a development context
    const developmentPattern = this.patterns$.value.find(p =>
      p.context.some(c => c.includes('development'))
    );

    if (developmentPattern) {
      const probability = this.estimateSuccessProbability(
        developmentPattern,
        energy,
        this.autonomic.observeAutonomicState()
      );

      if (probability < 0.7) {
        this.typeErrors$.next([{
          isValid: false,
          errors: ['Development success probability below threshold'],
          path: ['development', 'pattern'],
          pattern: developmentPattern.context.join(','),
          energy: energy.level
        }]);
      }
    }
  }

  // Enhanced Type Validation
  private validateFlowMetrics(metrics: FlowMetrics, path: string[]): TypeValidationResult {
    const errors: string[] = [];
    const context = [...this.validationContext];
    
    Object.entries(metrics).forEach(([key, value]) => {
      if (!isValidMeasure(value)) {
        errors.push(`Invalid ${key} value: ${value} at ${path.join('.')}`);
        context.push(`invalid_${key}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      path,
      context
    };
  }

  private validateFlowState(flow: FlowState, path: string[]): TypeValidationResult {
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

    const metricsValidation = this.validateFlowMetrics(flow.metrics, [...path, 'metrics']);
    errors.push(...metricsValidation.errors);
    context.push(...(metricsValidation.context || []));

    return {
      isValid: errors.length === 0,
      errors,
      path,
      context
    };
  }

  private validateConsciousnessState(state: ConsciousnessState, path: string[]): TypeValidationResult {
    const errors: string[] = [];
    
    const flowValidation = this.validateFlowState(state.flow, [...path, 'flow']);
    errors.push(...flowValidation.errors);

    if (!state.spaces || !Array.isArray(state.spaces)) {
      errors.push('Invalid spaces array');
    }

    return {
      isValid: errors.length === 0,
      errors,
      path
    };
  }

  // Public API
  public validateState(state: any) {
    const typeValidation = this.validateConsciousnessState(
      state,
      ['consciousness']
    );
    
    if (!typeValidation.isValid) {
      this.typeErrors$.next([typeValidation]);
      console.error('Type validation errors:', typeValidation.errors);
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