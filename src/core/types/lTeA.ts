import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, distinctUntilChanged, debounceTime, take } from 'rxjs/operators';
import { EnergySystem, EnergyState } from '../energy/EnergySystem';
import { PatternEvolution, PatternState } from '../patterns/PatternEvolution';
import { PredictiveValidation } from './PredictiveValidation';
import { Autonomic } from './Autonomic';
import { v4 as uuidv4 } from 'uuid';

export interface DevelopmentState {
  id: string;
  timestamp: number;
  energy: number;
  context: string[];
  activePatterns: string[];
  validationStatus: {
    isValid: boolean;
    errors: string[];
  };
  metrics: {
    patternStrength: number;
    patternCoherence: number;
    evolutionProgress: number;
    validationSuccess: number;
  };
}

export class AutonomicDevelopment {
  private state$ = new BehaviorSubject<DevelopmentState>({
    id: uuidv4(),
    timestamp: Date.now(),
    energy: 1.0,
    context: [],
    activePatterns: [],
    validationStatus: {
      isValid: true,
      errors: []
    },
    metrics: {
      patternStrength: 0,
      patternCoherence: 0,
      evolutionProgress: 0,
      validationSuccess: 1.0
    }
  });

  private readonly energySystem: EnergySystem;
  private readonly patternEvolution: PatternEvolution;
  private readonly predictiveValidation: PredictiveValidation;

  constructor() {
    this.energySystem = new EnergySystem();
    this.patternEvolution = new PatternEvolution();
    this.predictiveValidation = new PredictiveValidation(new Autonomic(), this.energySystem);

    this.initializeAutonomicSystem();
  }

  private initializeAutonomicSystem() {
    // Combine all observables
    combineLatest([
      this.energySystem.observeEnergy(),
      this.patternEvolution.observeAllPatterns(),
      this.predictiveValidation.observeTypeErrors()
    ]).pipe(
      debounceTime(1000)
    ).subscribe(([energy, patterns, validationErrors]) => {
      this.updateDevelopmentState(energy, patterns, validationErrors);
    });

    // Start continuous development cycle
    this.startDevelopmentCycle();
  }

  private updateDevelopmentState(
    energy: EnergyState,
    patterns: PatternState[],
    validationErrors: any[]
  ) {
    const systemHealth = this.patternEvolution.getSystemHealth();
    
    this.state$.next({
      ...this.state$.value,
      timestamp: Date.now(),
      energy: energy.level,
      context: energy.context || [],
      activePatterns: patterns.map(p => p.id),
      validationStatus: {
        isValid: validationErrors.length === 0,
        errors: validationErrors.flatMap(e => e.errors)
      },
      metrics: {
        patternStrength: systemHealth.overallStrength,
        patternCoherence: systemHealth.overallCoherence,
        evolutionProgress: systemHealth.evolvedPatterns / Math.max(1, patterns.length),
        validationSuccess: validationErrors.length === 0 ? 1.0 : 0.0
      }
    });
  }

  private startDevelopmentCycle() {
    setInterval(() => {
      const state = this.state$.value;
      
      // Only proceed if we have enough energy
      if (state.energy < 0.3) {
        console.warn('Energy too low for development cycle');
        return;
      }

      // Analyze current patterns
      this.analyzePatterns();

      // Evolve patterns if possible
      this.evolvePatterns();

      // Update validation context
      this.updateValidationContext();

    }, 5000); // Check every 5 seconds
  }

  private async analyzePatterns() {
    const patterns = await this.patternEvolution.observeAllPatterns()
      .pipe(take(1))
      .toPromise();

    if (!patterns) return;
    
    patterns.forEach((pattern: PatternState) => {
      const insights = this.patternEvolution.getEvolutionInsights(pattern.id);
      
      if (insights.recommendations.length > 0) {
        console.log(`Pattern ${pattern.id} recommendations:`, insights.recommendations);
      }

      // Update pattern metrics based on current state
      this.patternEvolution.updateMetrics(pattern.id, {
        coherence: this.calculatePatternCoherence(pattern),
        stability: this.calculatePatternStability(pattern),
        adaptability: this.calculatePatternAdaptability(pattern)
      });
    });
  }

  private calculatePatternCoherence(pattern: PatternState): number {
    const state = this.state$.value;
    const validationSuccess = state.metrics.validationSuccess;
    const patternStrength = pattern.metrics.strength;
    
    return (validationSuccess * 0.6) + (patternStrength * 0.4);
  }

  private calculatePatternStability(pattern: PatternState): number {
    const state = this.state$.value;
    const recentHistory = pattern.history.slice(-5);
    
    if (recentHistory.length < 5) return pattern.metrics.stability;

    const metricVariance = this.calculateVariance(
      recentHistory.map(h => h.metrics.strength)
    );

    return 1 - Math.min(1, metricVariance);
  }

  private calculatePatternAdaptability(pattern: PatternState): number {
    const state = this.state$.value;
    const currentEnergy = state.energy;
    
    // Higher adaptability when pattern performs well at different energy levels
    const energyLevels = new Set(
      pattern.history.slice(-10).map(h => 
        Math.floor(currentEnergy * 10) / 10
      )
    );

    return Math.min(1, energyLevels.size / 5);
  }

  private calculateVariance(values: number[]): number {
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squareDiffs = values.map(value => {
      const diff = value - avg;
      return diff * diff;
    });
    return Math.sqrt(
      squareDiffs.reduce((sum, sqr) => sum + sqr, 0) / values.length
    );
  }

  private async evolvePatterns() {
    const state = this.state$.value;
    
    // Only evolve patterns if we have high energy and validation success
    if (state.energy >= 0.8 && state.metrics.validationSuccess >= 0.9) {
      const patterns = await this.patternEvolution.observeAllPatterns()
        .pipe(take(1))
        .toPromise();

      if (!patterns) return;
      
      patterns.forEach((pattern: PatternState) => {
        const insights = this.patternEvolution.getEvolutionInsights(pattern.id);
        
        if (insights.readyToEvolve) {
          console.log(`Evolving pattern ${pattern.id} to stage ${insights.stage + 1}`);
          this.patternEvolution.updateMetrics(pattern.id, {
            strength: Math.min(1, pattern.metrics.strength + 0.1)
          });
        }
      });
    }
  }

  private updateValidationContext() {
    const state = this.state$.value;
    this.predictiveValidation.setValidationContext([
      ...state.context,
      `energy_${Math.floor(state.energy * 10) / 10}`,
      `patterns_${state.activePatterns.length}`,
      `evolution_${Math.floor(state.metrics.evolutionProgress * 100)}%`
    ]);
  }

  // Public API
  public observeDevelopment(): Observable<DevelopmentState> {
    return this.state$.asObservable();
  }

  public getPatternEvolution(): PatternEvolution {
    return this.patternEvolution;
  }

  public getPredictiveValidation(): PredictiveValidation {
    return this.predictiveValidation;
  }

  public getEnergySystem(): EnergySystem {
    return this.energySystem;
  }

  public getDevelopmentInsights(): {
    readiness: number;
    bottlenecks: string[];
    recommendations: string[];
    metrics: DevelopmentState['metrics'];
  } {
    const state = this.state$.value;
    const bottlenecks: string[] = [];
    const recommendations: string[] = [];

    // Analyze metrics
    if (state.metrics.patternStrength < 0.5) {
      bottlenecks.push('Low pattern strength');
      recommendations.push('Increase pattern usage and validation');
    }

    if (state.metrics.patternCoherence < 0.5) {
      bottlenecks.push('Low pattern coherence');
      recommendations.push('Improve pattern relationships and consistency');
    }

    if (state.metrics.evolutionProgress < 0.3) {
      bottlenecks.push('Slow evolution progress');
      recommendations.push('Focus on pattern stability and strength');
    }

    if (state.metrics.validationSuccess < 0.8) {
      bottlenecks.push('Validation issues');
      recommendations.push('Address validation errors and improve type safety');
    }

    // Calculate overall readiness
    const readiness = (
      state.metrics.patternStrength * 0.3 +
      state.metrics.patternCoherence * 0.3 +
      state.metrics.evolutionProgress * 0.2 +
      state.metrics.validationSuccess * 0.2
    );

    return {
      readiness,
      bottlenecks,
      recommendations,
      metrics: state.metrics
    };
  }
} 