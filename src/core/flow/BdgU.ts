import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { FlowSystem } from '../flow/FlowSystem';
import { EnergySystem } from '../energy/EnergySystem';
import { PatternSystem } from '../pattern/PatternSystem';
import { PresenceSystem } from '../presence/PresenceSystem';
import { ConsciousnessSystem } from '../consciousness/ConsciousnessSystem';
import { FieldSystem } from '../fields/FieldSystem';
import { ProtectionSystem } from '../protection/ProtectionSystem';
import { FlowState } from '../types/base';
import { ConsciousnessState } from '../types/consciousness';
import { Energy, EnergyMetrics } from '../energy/types';
import { EnergyPattern } from '../pattern/types';

export interface SystemState {
  isActive: boolean;
  isStable: boolean;
  metrics: {
    efficiency: number;
    sustainability: number;
    resilience: number;
    coherence: number;
  };
}

export class SystemIntegration {
  private state$: BehaviorSubject<SystemState>;
  private readonly STABILITY_THRESHOLD = 0.7;

  constructor(
    private readonly flowSystem: FlowSystem,
    private readonly energySystem: EnergySystem,
    private readonly patternSystem: PatternSystem,
    private readonly presenceSystem: PresenceSystem,
    private readonly consciousnessSystem: ConsciousnessSystem,
    private readonly fieldSystem: FieldSystem,
    private readonly protectionSystem: ProtectionSystem
  ) {
    this.state$ = new BehaviorSubject<SystemState>({
      isActive: false,
      isStable: true,
      metrics: {
        efficiency: 1.0,
        sustainability: 1.0,
        resilience: 1.0,
        coherence: 1.0
      }
    });

    this.initializeSubscriptions();
  }

  public activate(): void {
    const currentState = this.state$.getValue();
    this.state$.next({
      ...currentState,
      isActive: true
    });
  }

  public deactivate(): void {
    const currentState = this.state$.getValue();
    this.state$.next({
      ...currentState,
      isActive: false
    });
  }

  public getState(): Observable<SystemState> {
    return this.state$.asObservable();
  }

  public handleStateTransition(newState: FlowState): void {
    const consciousness = (this.consciousnessSystem.getState() as BehaviorSubject<ConsciousnessState>).getValue();
    const energy = (this.energySystem.observeEnergy() as BehaviorSubject<Energy>).getValue();

    // Convert ConsciousnessMetrics to EnergyMetrics
    const energyMetrics: EnergyMetrics = {
      efficiency: consciousness.metrics.coherence,
      sustainability: consciousness.metrics.integration,
      recovery: consciousness.metrics.flexibility,
      adaptability: consciousness.metrics.depth,
      stability: consciousness.metrics.clarity
    };

    // Update flow state
    this.flowSystem.transitionTo(newState, energy, energyMetrics);

    // Update energy based on flow transition
    this.energySystem.handleFlowTransition(newState, consciousness);

    // Update presence based on flow transition
    this.presenceSystem.handleFlowTransition(newState, consciousness, energy);

    // Update protection based on state change
    this.protectionSystem.handleStateTransition(newState, consciousness);

    // Update consciousness state
    this.consciousnessSystem.updateState(newState);

    // Find and evolve matching pattern
    const pattern = this.patternSystem.findMatchingPattern(newState, energy);
    if (pattern) {
      this.patternSystem.evolvePattern(pattern.pattern, {
        energyLevels: energy,
        metrics: energyMetrics
      }, true);
    }

    this.updateSystemState();
  }

  public synchronize(): void {
    const consciousness = (this.consciousnessSystem.getState() as BehaviorSubject<ConsciousnessState>).getValue();
    
    // Synchronize presence with consciousness
    this.presenceSystem.synchronize(consciousness);

    // Synchronize fields with consciousness
    consciousness.fields.forEach(field => {
      this.fieldSystem.updateField(field.id, {
        strength: field.strength * consciousness.flowSpace.stability
      });
    });

    this.updateSystemState();
  }

  private initializeSubscriptions(): void {
    // Monitor flow state changes
    this.flowSystem.getState().subscribe(flowState => {
      if (flowState.isStable !== this.state$.getValue().isStable) {
        this.updateSystemState();
      }
    });

    // Monitor energy state changes
    this.energySystem.observeState().subscribe(() => {
      this.updateSystemState();
    });

    // Monitor pattern state changes
    this.patternSystem.getState().subscribe(patternState => {
      if (patternState.isStable !== this.state$.getValue().isStable) {
        this.updateSystemState();
      }
    });

    // Monitor protection state changes
    this.protectionSystem.getState().subscribe(protectionState => {
      if (!protectionState.isProtected) {
        this.handleProtectionBreach(0.5); // Medium severity breach
      }
    });
  }

  private updateSystemState(): void {
    const flowState = (this.flowSystem.getState() as BehaviorSubject<any>).getValue();
    const energyState = (this.energySystem.observeState() as BehaviorSubject<any>).getValue();
    const patternState = (this.patternSystem.getState() as BehaviorSubject<any>).getValue();
    const presenceState = (this.presenceSystem.observeState() as BehaviorSubject<any>).getValue();
    const protectionState = (this.protectionSystem.getState() as BehaviorSubject<any>).getValue();

    const metrics = this.calculateSystemMetrics(
      flowState,
      energyState,
      patternState,
      presenceState,
      protectionState
    );

    this.state$.next({
      ...this.state$.getValue(),
      isStable: this.checkSystemStability(metrics),
      metrics
    });
  }

  private calculateSystemMetrics(
    flowState: any,
    energyState: any,
    patternState: any,
    presenceState: any,
    protectionState: any
  ): {
    efficiency: number;
    sustainability: number;
    resilience: number;
    coherence: number;
  } {
    const efficiency = (
      flowState.metrics.efficiency * 0.3 +
      energyState.metrics.efficiency * 0.3 +
      presenceState.metrics.clarity * 0.4
    );

    const sustainability = (
      energyState.metrics.sustainability * 0.4 +
      protectionState.metrics.sustainability * 0.3 +
      presenceState.metrics.stability * 0.3
    );

    const resilience = (
      protectionState.metrics.resilience * 0.4 +
      (patternState.isStable ? 0.4 : 0.2) +
      presenceState.metrics.coherence * 0.2
    );

    const coherence = (
      presenceState.metrics.coherence * 0.4 +
      flowState.metrics.stability * 0.3 +
      protectionState.metrics.integrity * 0.3
    );

    return {
      efficiency: Math.min(1, efficiency),
      sustainability: Math.min(1, sustainability),
      resilience: Math.min(1, resilience),
      coherence: Math.min(1, coherence)
    };
  }

  private checkSystemStability(metrics: {
    efficiency: number;
    sustainability: number;
    resilience: number;
    coherence: number;
  }): boolean {
    const stabilityScore = (
      metrics.efficiency * 0.3 +
      metrics.sustainability * 0.3 +
      metrics.resilience * 0.2 +
      metrics.coherence * 0.2
    );

    return stabilityScore >= this.STABILITY_THRESHOLD;
  }

  private handleProtectionBreach(severity: number): void {
    const currentState = this.state$.getValue();
    
    if (!currentState.isActive) return;

    // Update protection system
    this.protectionSystem.handleBreach(severity);

    // Force consciousness recovery
    this.consciousnessSystem.updateState(FlowState.RECOVERING);

    // Update energy system
    this.energySystem.deplete(severity);

    this.updateSystemState();
  }
} 