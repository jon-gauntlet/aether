import { BehaviorSubject, Observable } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import {
  EnergyState,
  NaturalFlow,
  isProtected,
  isCoherent
} from '../types/consciousness';

export class EnergySystem {
  private energy$: BehaviorSubject<EnergyState>;
  private flow$: BehaviorSubject<NaturalFlow>;

  constructor(
    initialEnergy: EnergyState,
    initialFlow: NaturalFlow
  ) {
    this.energy$ = new BehaviorSubject<EnergyState>(initialEnergy);
    this.flow$ = new BehaviorSubject<NaturalFlow>(initialFlow);
    this.initializeProtection();
  }

  private initializeProtection(): void {
    // Core protection cycles
    setInterval(() => this.maintainEnergy(), 100);
    setInterval(() => this.purifyFlow(), 150);
  }

  // Energy Protection
  private maintainEnergy(): void {
    const currentEnergy = this.energy$.value;
    
    if (!isProtected(currentEnergy)) {
      this.energy$.next({
        ...currentEnergy,
        protection: Math.min(currentEnergy.protection + 0.1, 1),
        stability: Math.min(currentEnergy.stability + 0.1, 1)
      });
    }
  }

  // Flow Protection
  private purifyFlow(): void {
    const currentFlow = this.flow$.value;
    
    if (!isCoherent(currentFlow)) {
      this.flow$.next({
        ...currentFlow,
        coherence: Math.min(currentFlow.coherence + 0.1, 1),
        presence: Math.min(currentFlow.presence + 0.1, 1)
      });
    }
  }

  // Energy Operations
  raiseEnergy(): void {
    const current = this.energy$.value;
    this.energy$.next({
      ...current,
      level: Math.min(current.level + 0.1, 1),
      quality: Math.min(current.quality + 0.05, 1)
    });
  }

  conserveEnergy(): void {
    const current = this.energy$.value;
    this.energy$.next({
      ...current,
      stability: Math.min(current.stability + 0.1, 1),
      protection: Math.min(current.protection + 0.1, 1)
    });
  }

  // Flow Operations
  increaseFlow(): void {
    const current = this.flow$.value;
    this.flow$.next({
      ...current,
      rhythm: Math.min(current.rhythm + 0.1, 1),
      resonance: Math.min(current.resonance + 0.1, 1)
    });
  }

  deepenFlow(): void {
    const current = this.flow$.value;
    this.flow$.next({
      ...current,
      coherence: Math.min(current.coherence + 0.1, 1),
      presence: Math.min(current.presence + 0.1, 1)
    });
  }

  // Observation
  observeEnergy(): Observable<EnergyState> {
    return this.energy$.pipe(distinctUntilChanged());
  }

  observeFlow(): Observable<NaturalFlow> {
    return this.flow$.pipe(distinctUntilChanged());
  }

  // Pure Functions
  static calculateEnergyQuality(energy: EnergyState): number {
    return (
      energy.level * 0.3 +
      energy.quality * 0.3 +
      energy.stability * 0.2 +
      energy.protection * 0.2
    );
  }

  static calculateFlowQuality(flow: NaturalFlow): number {
    return (
      flow.rhythm * 0.3 +
      flow.resonance * 0.3 +
      flow.coherence * 0.2 +
      flow.presence * 0.2
    );
  }
} 