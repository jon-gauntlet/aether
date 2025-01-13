import { Observable, combineLatest } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import {
  ConsciousnessState,
  NaturalFlow,
  EnergyState,
  FlowSpace,
  Connection,
  isCoherent,
  isProtected,
  isFlowing
} from '../types/consciousness';

export class NaturalIntegration {
  constructor(
    private flow$: Observable<NaturalFlow>,
    private energy$: Observable<EnergyState>,
    private spaces: Map<string, Observable<FlowSpace>>
  ) {}

  // Natural Observation
  observeIntegratedState(): Observable<ConsciousnessState> {
    return combineLatest([
      this.flow$,
      this.energy$,
      this.observeAllSpaces()
    ]).pipe(
      map(([flow, energy, spaces]) => ({
        flow,
        energy,
        spaces,
        meta: {
          baseFrequency: this.calculateBaseFrequency(flow, energy),
          coherenceThreshold: this.calculateCoherenceThreshold(flow, energy),
          protectionLevel: this.calculateProtectionLevel(flow, energy)
        }
      })),
      distinctUntilChanged()
    );
  }

  private observeAllSpaces(): Observable<FlowSpace[]> {
    return new Observable<FlowSpace[]>(observer => {
      const emitSpaces = () => {
        const spaces = Array.from(this.spaces.values());
        Promise.all(
          spaces.map(space$ => 
            new Promise<FlowSpace>(resolve => 
              space$.pipe(distinctUntilChanged()).subscribe(resolve)
            )
          )
        ).then(spaces => observer.next(spaces));
      };

      // Initial emission
      emitSpaces();

      // Subscribe to all space changes
      const subscriptions = Array.from(this.spaces.values()).map(space$ =>
        space$.subscribe(() => emitSpaces())
      );

      // Cleanup
      return () => subscriptions.forEach(sub => sub.unsubscribe());
    });
  }

  // Natural Calculations
  private calculateBaseFrequency(flow: NaturalFlow, energy: EnergyState): number {
    return (
      (flow.rhythm * 0.4) +
      (flow.resonance * 0.3) +
      (energy.quality * 0.3)
    );
  }

  private calculateCoherenceThreshold(flow: NaturalFlow, energy: EnergyState): number {
    return (
      (flow.coherence * 0.4) +
      (flow.presence * 0.3) +
      (energy.stability * 0.3)
    );
  }

  private calculateProtectionLevel(flow: NaturalFlow, energy: EnergyState): number {
    return (
      (energy.protection * 0.4) +
      (energy.stability * 0.3) +
      (flow.presence * 0.3)
    );
  }

  // Pure Functions
  static calculateSpaceResonance(spaces: FlowSpace[]): number {
    if (spaces.length === 0) return 1;
    
    return spaces.reduce((acc, space) => 
      acc + (
        (space.flow.resonance * 0.4) +
        (space.flow.coherence * 0.3) +
        (space.depth * 0.3)
      ), 0
    ) / spaces.length;
  }

  static calculateSystemCoherence(
    flow: NaturalFlow,
    energy: EnergyState,
    spaces: FlowSpace[]
  ): number {
    const flowCoherence = (
      flow.coherence * 0.4 +
      flow.presence * 0.3 +
      flow.resonance * 0.3
    );

    const energyCoherence = (
      energy.quality * 0.4 +
      energy.stability * 0.3 +
      energy.protection * 0.3
    );

    const spaceCoherence = NaturalIntegration.calculateSpaceResonance(spaces);

    return (
      flowCoherence * 0.4 +
      energyCoherence * 0.3 +
      spaceCoherence * 0.3
    );
  }

  static calculateSystemProtection(
    flow: NaturalFlow,
    energy: EnergyState,
    spaces: FlowSpace[]
  ): number {
    const flowProtection = (
      flow.presence * 0.4 +
      flow.coherence * 0.3 +
      flow.resonance * 0.3
    );

    const energyProtection = (
      energy.protection * 0.4 +
      energy.stability * 0.3 +
      energy.quality * 0.3
    );

    const spaceProtection = spaces.reduce((acc, space) =>
      acc + space.depth, 0
    ) / Math.max(1, spaces.length);

    return (
      flowProtection * 0.4 +
      energyProtection * 0.4 +
      spaceProtection * 0.2
    );
  }
} 