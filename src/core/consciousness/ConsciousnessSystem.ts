import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { NaturalFlow } from '../flow/NaturalFlow';
import { EnergySystem } from '../energy/EnergySystem';
import { ProtectionSystem } from '../protection/ProtectionSystem';

const GOLDEN_RATIO = 1.618033988749895;
const NATURAL_CYCLE = 8000;

export interface ConsciousnessState {
  presence: number;
  energy: number;
  coherence: number;
  protection: number;
  flow: {
    depth: number;
    clarity: number;
    resonance: number;
  };
}

export interface SystemState {
  coherence: number;
  depth: number;
  clarity: number;
  resonance: number;
}

export class ConsciousnessSystem {
  private state$ = new BehaviorSubject<ConsciousnessState>({
    presence: 1,
    energy: 1,
    coherence: 1,
    protection: 1,
    flow: {
      depth: 1,
      clarity: 1,
      resonance: 1
    }
  });

  private flow: NaturalFlow;
  private energy: EnergySystem;
  private protection: ProtectionSystem;
  private intervals: NodeJS.Timeout[] = [];

  constructor() {
    this.flow = new NaturalFlow();
    this.energy = new EnergySystem();
    this.protection = new ProtectionSystem();

    this.initializeNaturalCycles();
    this.initializeSystemIntegration();
  }

  private initializeNaturalCycles() {
    // Natural presence cycle
    this.intervals.push(
      setInterval(() => {
        const current = this.state$.value;
        const naturalPresence = Math.min(1, current.presence + (1 / GOLDEN_RATIO) * 0.1);
        
        this.state$.next({
          ...current,
          presence: naturalPresence
        });
      }, NATURAL_CYCLE)
    );
  }

  private initializeSystemIntegration() {
    // Combine all system states
    const systemState$ = combineLatest([
      this.flow.observe(),
      this.energy.observe(),
      this.protection.observe()
    ]).pipe(
      map(([flowState, energyState, protectionState]) => {
        const coherence = (flowState.coherence + energyState.coherence + protectionState.coherence) / 3;
        
        return {
          coherence,
          flow: {
            depth: flowState.depth,
            clarity: flowState.clarity,
            resonance: flowState.resonance
          },
          energy: energyState.level,
          protection: protectionState.level
        };
      })
    );

    // Subscribe to system state changes
    systemState$.subscribe(({ coherence, flow, energy, protection }) => {
      const current = this.state$.value;
      this.state$.next({
        ...current,
        coherence,
        energy,
        protection,
        flow
      });
    });
  }

  public observe(): Observable<ConsciousnessState> {
    return this.state$.asObservable();
  }

  public observePresence(): Observable<number> {
    return this.state$.pipe(
      map(state => state.presence),
      distinctUntilChanged()
    );
  }

  public observeEnergy(): Observable<number> {
    return this.state$.pipe(
      map(state => state.energy),
      distinctUntilChanged()
    );
  }

  public observeCoherence(): Observable<number> {
    return this.state$.pipe(
      map(state => state.coherence),
      distinctUntilChanged()
    );
  }

  public dispose() {
    this.intervals.forEach(clearInterval);
    this.intervals = [];
    this.state$.complete();
    this.flow.dispose();
    this.energy.dispose();
    this.protection.dispose();
  }
} 