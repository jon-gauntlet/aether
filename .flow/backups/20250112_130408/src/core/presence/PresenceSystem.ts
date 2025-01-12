import { BehaviorSubject, Observable } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import {
  NaturalFlow,
  FlowSpace,
  EnergyState,
  isCoherent,
  isProtected,
  isFlowing
} from '../types/consciousness';

export class PresenceSystem {
  private flow$: BehaviorSubject<NaturalFlow>;
  private energy$: BehaviorSubject<EnergyState>;
  private spaces: Map<string, BehaviorSubject<FlowSpace>>;

  constructor(
    initialFlow: NaturalFlow,
    initialEnergy: EnergyState
  ) {
    this.flow$ = new BehaviorSubject<NaturalFlow>(initialFlow);
    this.energy$ = new BehaviorSubject<EnergyState>(initialEnergy);
    this.spaces = new Map();
    this.initializeProtection();
  }

  private initializeProtection(): void {
    // Core protection cycles
    setInterval(() => this.maintainPresence(), 100);
    setInterval(() => this.deepenStates(), 150);
  }

  // Protection Systems
  private maintainPresence(): void {
    const currentFlow = this.flow$.value;
    const currentEnergy = this.energy$.value;

    // Maintain flow coherence
    if (!isCoherent(currentFlow)) {
      this.flow$.next({
        ...currentFlow,
        coherence: Math.min(currentFlow.coherence + 0.1, 1),
        presence: Math.min(currentFlow.presence + 0.1, 1)
      });
    }

    // Protect energy
    if (!isProtected(currentEnergy)) {
      this.energy$.next({
        ...currentEnergy,
        protection: Math.min(currentEnergy.protection + 0.1, 1),
        stability: Math.min(currentEnergy.stability + 0.1, 1)
      });
    }
  }

  private deepenStates(): void {
    // Deepen space states
    this.spaces.forEach((space$) => {
      const space = space$.value;
      if (!isFlowing(space)) {
        space$.next({
          ...space,
          flow: {
            ...space.flow,
            rhythm: Math.min(space.flow.rhythm + 0.1, 1),
            resonance: Math.min(space.flow.resonance + 0.1, 1)
          }
        });
      }
    });
  }

  // Space Operations
  createSpace(type: FlowSpace['type']): string {
    const id = crypto.randomUUID();
    const space: FlowSpace = {
      id,
      type,
      flow: {
        rhythm: 1,
        resonance: 1,
        coherence: 1,
        presence: 1
      },
      depth: 1,
      connections: []
    };

    this.spaces.set(id, new BehaviorSubject(space));
    return id;
  }

  deepenSpace(id: string): void {
    const space = this.spaces.get(id)?.value;
    if (space) {
      this.spaces.get(id)?.next({
        ...space,
        depth: Math.min(space.depth + 0.1, 1)
      });
    }
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

  // Observation
  observeFlow(): Observable<NaturalFlow> {
    return this.flow$.pipe(distinctUntilChanged());
  }

  observeEnergy(): Observable<EnergyState> {
    return this.energy$.pipe(distinctUntilChanged());
  }

  observeSpace(id: string): Observable<FlowSpace | undefined> {
    return this.spaces.get(id)?.pipe(
      distinctUntilChanged()
    ) || new Observable<FlowSpace>();
  }

  // Pure Functions
  static calculatePresenceQuality(
    flow: NaturalFlow,
    energy: EnergyState
  ): number {
    const flowQuality = (
      flow.rhythm * 0.3 +
      flow.resonance * 0.3 +
      flow.coherence * 0.2 +
      flow.presence * 0.2
    );

    const energyQuality = (
      energy.level * 0.3 +
      energy.quality * 0.3 +
      energy.stability * 0.2 +
      energy.protection * 0.2
    );

    return (flowQuality * 0.6 + energyQuality * 0.4);
  }

  static calculateSpacePresence(space: FlowSpace): number {
    return (
      space.flow.presence * 0.4 +
      space.flow.coherence * 0.3 +
      space.depth * 0.3
    );
  }
} 