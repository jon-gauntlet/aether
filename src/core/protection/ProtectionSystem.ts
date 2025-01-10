import { BehaviorSubject, Observable } from 'rxjs';
import { Field } from '../types/base';
import { ConsciousnessState } from '../types/consciousness';

export interface ProtectionState {
  isProtected: boolean;
  shields: number;
  resilience: number;
  recovery: number;
  adaptability: number;
}

export interface ProtectionEvent {
  timestamp: number;
  type: 'BREACH' | 'RECOVERY' | 'ADAPTATION' | 'REINFORCEMENT';
  severity: number;
  source: string;
}

export class ProtectionSystem {
  private state$: BehaviorSubject<ProtectionState>;
  private events: ProtectionEvent[] = [];
  private readonly MIN_SHIELDS = 0.2;
  private readonly RECOVERY_RATE = 0.1;
  private readonly ADAPTATION_THRESHOLD = 0.7;

  constructor(initialState?: Partial<ProtectionState>) {
    this.state$ = new BehaviorSubject<ProtectionState>({
      isProtected: true,
      shields: 1.0,
      resilience: 0.8,
      recovery: 0.7,
      adaptability: 0.6,
      ...initialState
    });
  }

  public getState(): Observable<ProtectionState> {
    return this.state$.asObservable();
  }

  public updateProtection(field: Field, consciousness: ConsciousnessState): void {
    const currentState = this.state$.getValue();
    const { protection } = field;
    const { stability } = consciousness.flowSpace;

    const newShields = Math.max(
      this.MIN_SHIELDS,
      protection.shields * stability
    );

    const newResilience = protection.resilience * consciousness.metrics.coherence;
    const newRecovery = protection.recovery * consciousness.metrics.integration;
    const newAdaptability = protection.adaptability * consciousness.metrics.flexibility;

    this.state$.next({
      ...currentState,
      shields: newShields,
      resilience: newResilience,
      recovery: newRecovery,
      adaptability: newAdaptability,
      isProtected: newShields > this.MIN_SHIELDS
    });
  }

  public handleBreach(severity: number, source: string): void {
    const currentState = this.state$.getValue();
    const newShields = Math.max(
      this.MIN_SHIELDS,
      currentState.shields - severity * (1 - currentState.resilience)
    );

    this.state$.next({
      ...currentState,
      shields: newShields,
      isProtected: newShields > this.MIN_SHIELDS
    });

    this.recordEvent({
      timestamp: Date.now(),
      type: 'BREACH',
      severity,
      source
    });
  }

  public initiateRecovery(): void {
    const currentState = this.state$.getValue();
    const recoveryAmount = this.RECOVERY_RATE * currentState.recovery;

    this.state$.next({
      ...currentState,
      shields: Math.min(1.0, currentState.shields + recoveryAmount),
      isProtected: true
    });

    this.recordEvent({
      timestamp: Date.now(),
      type: 'RECOVERY',
      severity: recoveryAmount,
      source: 'system'
    });
  }

  public adapt(field: Field): void {
    const currentState = this.state$.getValue();
    if (currentState.adaptability > this.ADAPTATION_THRESHOLD) {
      const adaptationStrength = currentState.adaptability * field.protection.adaptability;

      this.state$.next({
        ...currentState,
        resilience: Math.min(1.0, currentState.resilience + adaptationStrength * 0.1),
        recovery: Math.min(1.0, currentState.recovery + adaptationStrength * 0.05)
      });

      this.recordEvent({
        timestamp: Date.now(),
        type: 'ADAPTATION',
        severity: adaptationStrength,
        source: field.id
      });
    }
  }

  public reinforce(amount: number): void {
    const currentState = this.state$.getValue();
    this.state$.next({
      ...currentState,
      shields: Math.min(1.0, currentState.shields + amount),
      resilience: Math.min(1.0, currentState.resilience + amount * 0.2)
    });

    this.recordEvent({
      timestamp: Date.now(),
      type: 'REINFORCEMENT',
      severity: amount,
      source: 'system'
    });
  }

  public getEvents(): ProtectionEvent[] {
    return this.events;
  }

  private recordEvent(event: ProtectionEvent): void {
    this.events.push(event);
    // Keep last 100 events
    if (this.events.length > 100) {
      this.events.shift();
    }
  }
} 