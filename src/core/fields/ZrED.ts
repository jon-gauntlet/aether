import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { Field, FlowState } from '../types/base';
import { ConsciousnessState } from '../types/consciousness';
import { Energy, EnergyMetrics } from '../energy/types';
import { FieldSystem } from '../fields/FieldSystem';
import { MetricsSystem } from '../metrics/MetricsSystem';
import { ProtectionSystem } from '../protection/ProtectionSystem';
import { ContextSystem } from '../context/ContextSystem';
import { PatternSystem } from '../autonomic/PatternSystem';

export interface IntegrationState {
  isInitialized: boolean;
  isStable: boolean;
  systemHealth: number;
  activeSubsystems: string[];
}

export class SystemIntegration {
  private state$: BehaviorSubject<IntegrationState>;
  private fieldSystem: FieldSystem;
  private metricsSystem: MetricsSystem;
  private protectionSystem: ProtectionSystem;
  private contextSystem: ContextSystem;
  private patternSystem: PatternSystem;

  constructor() {
    this.state$ = new BehaviorSubject<IntegrationState>({
      isInitialized: false,
      isStable: false,
      systemHealth: 0,
      activeSubsystems: []
    });

    this.fieldSystem = new FieldSystem();
    this.metricsSystem = new MetricsSystem();
    this.protectionSystem = new ProtectionSystem();
    this.contextSystem = new ContextSystem();
    this.patternSystem = new PatternSystem();
  }

  public initialize(): void {
    this.contextSystem.startTracking();
    this.updateState({
      isInitialized: true,
      activeSubsystems: [
        'field',
        'metrics',
        'protection',
        'context',
        'pattern'
      ]
    });
  }

  public shutdown(): void {
    this.contextSystem.stopTracking();
    this.updateState({
      isInitialized: false,
      activeSubsystems: []
    });
  }

  public getState(): Observable<IntegrationState> {
    return this.state$.asObservable();
  }

  public updateField(field: Field): void {
    this.fieldSystem.updateField(field.id, field);
    this.metricsSystem.updateFieldMetrics(field);
    this.protectionSystem.updateProtection(field, this.contextSystem.getCurrentContext().consciousness);
    this.checkSystemHealth();
  }

  public updateEnergy(energy: Energy, metrics: EnergyMetrics): void {
    this.metricsSystem.updateEnergyMetrics(energy, metrics);
    this.checkSystemHealth();
  }

  public updateConsciousness(consciousness: ConsciousnessState): void {
    this.contextSystem.updateContext(
      consciousness.currentState,
      this.contextSystem.getCurrentContext().energy,
      this.contextSystem.getCurrentContext().metrics,
      this.fieldSystem.getFieldState().value.activeField,
      consciousness
    );
    this.checkSystemHealth();
  }

  public handleStateTransition(newState: FlowState): void {
    const context = this.contextSystem.getCurrentContext();
    const matches = this.patternSystem.findMatches(
      context.field!,
      context.consciousness
    );

    if (matches.length > 0) {
      const topMatch = matches[0];
      this.protectionSystem.adapt(context.field!);
      this.metricsSystem.updateFlowMetrics(
        newState,
        topMatch.confidence,
        context.metrics.efficiency,
        0
      );
    }

    this.checkSystemHealth();
  }

  public handleSystemBreach(severity: number, source: string): void {
    this.protectionSystem.handleBreach(severity, source);
    
    if (severity > 0.7) {
      this.contextSystem.updateContext(
        FlowState.RECOVERING,
        this.contextSystem.getCurrentContext().energy,
        this.contextSystem.getCurrentContext().metrics,
        this.fieldSystem.getFieldState().value.activeField,
        this.contextSystem.getCurrentContext().consciousness
      );
    }

    this.checkSystemHealth();
  }

  private checkSystemHealth(): void {
    const fieldState = this.fieldSystem.getFieldState().value;
    const protectionState = this.protectionSystem.getState().value;
    const metrics = this.metricsSystem.getMetrics().value;

    const systemHealth = (
      (fieldState.isStable ? 1 : 0) +
      (protectionState.isProtected ? 1 : 0) +
      (metrics.energy.efficiency > 0.5 ? 1 : 0)
    ) / 3;

    this.updateState({
      isStable: systemHealth > 0.7,
      systemHealth
    });
  }

  private updateState(updates: Partial<IntegrationState>): void {
    const currentState = this.state$.getValue();
    this.state$.next({
      ...currentState,
      ...updates
    });
  }
} 