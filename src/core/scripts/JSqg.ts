import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, distinctUntilChanged, debounceTime, take } from 'rxjs/operators';
import { FlowStateGuardian } from '../flow/FlowStateGuardian';
import { EnergySystem } from '../energy/EnergySystem';
import { PredictiveValidation } from '../autonomic/PredictiveValidation';
import { AutonomicSystem } from '../autonomic/Autonomic';
import { 
  SystemState, 
  IntegrationMetrics, 
  CycleType,
  FlowState,
  ConsciousnessState 
} from '../types/base';

// Natural system proportions for harmonious operation
const NATURAL_PROPORTIONS = {
  PRIMARY: 0.618033988749895,    // Golden ratio - primary cycle timing
  SECONDARY: 0.414213562373095,  // Silver ratio - secondary pattern timing
  TERTIARY: 0.302775637731995    // Bronze ratio - foundational rhythm
};

// Core system cycles for natural rhythm alignment
const SYSTEM_CYCLES = {
  MICRO_PAUSE: 5000,    // Micro-restoration cycle (5s)
  REFLECTION: 8000,     // Pattern recognition cycle (8s)
  INTEGRATION: 13000    // Deep harmony cycle (13s)
};

export interface SystemStateValidation {
  isValid: boolean;
  insights: string[];
  metrics: IntegrationMetrics;
}

export class SystemIntegration {
  private readonly flowGuardian: FlowStateGuardian;
  private readonly energySystem: EnergySystem;
  private readonly validation: PredictiveValidation;
  private readonly autonomic: AutonomicSystem;
  private readonly metrics$ = new BehaviorSubject<IntegrationMetrics>({
    harmony: 0,
    presence: 0,
    clarity: 0,
    resonance: 0,
    coherence: 0,
    alignment: 0
  });

  constructor(
    flowGuardian: FlowStateGuardian,
    energySystem: EnergySystem,
    validation: PredictiveValidation,
    autonomic: AutonomicSystem
  ) {
    this.flowGuardian = flowGuardian;
    this.energySystem = energySystem;
    this.validation = validation;
    this.autonomic = autonomic;
    this.initializeNaturalCycles();
  }

  private initializeNaturalCycles() {
    // Micro-restoration cycle
    setInterval(() => {
      this.microRestoration();
    }, SYSTEM_CYCLES.MICRO_PAUSE);

    // Pattern recognition cycle  
    setInterval(() => {
      this.patternRecognition();
    }, SYSTEM_CYCLES.REFLECTION);

    // Deep harmony cycle
    setInterval(() => {
      this.harmonyIntegration();
    }, SYSTEM_CYCLES.INTEGRATION);
  }

  private async microRestoration() {
    const metrics = this.metrics$.value;
    metrics.presence = await this.calculatePresence();
    metrics.clarity = await this.calculateClarity();
    this.metrics$.next(metrics);
  }

  private async patternRecognition() {
    const metrics = this.metrics$.value;
    metrics.resonance = await this.calculateResonance();
    metrics.coherence = await this.calculateCoherence();
    this.metrics$.next(metrics);
  }

  private async harmonyIntegration() {
    const metrics = this.metrics$.value;
    metrics.harmony = this.calculateHarmony();
    metrics.alignment = this.calculateAlignment();
    this.metrics$.next(metrics);
  }

  private async calculatePresence(): Promise<number> {
    // Calculate presence based on flow state and energy levels
    return new Promise<number>(resolve => {
      this.flowGuardian.observeContext("main").pipe(
        take(1),
        map(context => context.metrics.quality * NATURAL_PROPORTIONS.PRIMARY)
      ).subscribe(value => resolve(value));
    });
  }

  private async calculateClarity(): Promise<number> {
    // Calculate clarity based on context retention and focus
    return new Promise<number>(resolve => {
      this.energySystem.observeEnergy().pipe(
        take(1),
        map(energy => energy.focusMultiplier * NATURAL_PROPORTIONS.SECONDARY)
      ).subscribe(value => resolve(value));
    });
  }

  private async calculateResonance(): Promise<number> {
    // Calculate resonance between different system components
    return new Promise<number>(resolve => {
      this.flowGuardian.observeHyperfocus("main").pipe(
        take(1),
        map(metrics => metrics.resonance * NATURAL_PROPORTIONS.TERTIARY)
      ).subscribe(value => resolve(value));
    });
  }

  private async calculateCoherence(): Promise<number> {
    // Calculate system coherence and pattern alignment
    return new Promise<number>(resolve => {
      this.energySystem.observeEnergy().pipe(
        take(1),
        map(energy => energy.recoveryEfficiency * NATURAL_PROPORTIONS.PRIMARY)
      ).subscribe(value => resolve(value));
    });
  }

  private calculateHarmony(): number {
    // Calculate overall system harmony
    return (
      this.metrics$.value.presence * NATURAL_PROPORTIONS.PRIMARY +
      this.metrics$.value.clarity * NATURAL_PROPORTIONS.SECONDARY +
      this.metrics$.value.resonance * NATURAL_PROPORTIONS.TERTIARY
    ) / 3;
  }

  private calculateAlignment(): number {
    // Calculate alignment with natural patterns
    return (
      this.metrics$.value.coherence * NATURAL_PROPORTIONS.PRIMARY +
      this.metrics$.value.harmony * NATURAL_PROPORTIONS.SECONDARY
    ) / 2;
  }

  public observeMetrics(): Observable<IntegrationMetrics> {
    return this.metrics$.asObservable().pipe(
      distinctUntilChanged(),
      debounceTime(SYSTEM_CYCLES.MICRO_PAUSE)
    );
  }

  public getCurrentState(): SystemState {
    return {
      metrics: this.metrics$.value,
      timestamp: Date.now(),
      cycle: this.determineCurrentCycle()
    };
  }

  private determineCurrentCycle(): CycleType {
    const now = Date.now();
    if (now % SYSTEM_CYCLES.INTEGRATION === 0) return 'harmony';
    if (now % SYSTEM_CYCLES.REFLECTION === 0) return 'reflection';
    if (now % SYSTEM_CYCLES.MICRO_PAUSE === 0) return 'restoration';
    return 'flow';
  }

  public async validateSystemState(): Promise<SystemStateValidation> {
    const state = await this.getCurrentState();
    const flowState = await this.flowGuardian.getCurrentState();
    
    const consciousnessState: ConsciousnessState = {
      flow: flowState,
      metrics: {
        coherence: state.metrics.coherence,
        stability: state.metrics.alignment,
        quality: state.metrics.clarity
      },
      spaces: ['system']
    };

    const validation = await this.validation.validateState(consciousnessState);

    return {
      isValid: validation.isValid,
      insights: validation.errors,
      metrics: state.metrics
    };
  }
}