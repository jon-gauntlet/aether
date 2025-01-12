import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { 
  FlowState, 
  Protection, 
  Field, 
  NaturalPattern,
  Resonance,
  SacredSpace,
  Wave,
  DevelopmentPhase
} from '../types/base';

interface AutonomicMetrics {
  confidence: number;
  pattern_resonance: number;
  flow_protection: number;
  mode: 'active' | 'passive' | 'protective';
}

interface EnhancedFlowState extends FlowState {
  developmentPhase: DevelopmentPhase;
  autonomicMetrics: AutonomicMetrics;
  energyState: {
    current: number;
    efficiency: number;
    phase: 'charging' | 'discharging' | 'stable';
  };
}

export class AutonomicSystem {
  private flowState$ = new BehaviorSubject<EnhancedFlowState | null>(null);
  private naturalRhythm = 1.618033988749895; // Golden ratio
  private developmentPhase$ = new BehaviorSubject<DevelopmentPhase>(DevelopmentPhase.CONFIGURATION);
  
  constructor() {
    this.initializeNaturalState();
    this.initializeAutonomicObservables();
  }

  private initializeAutonomicObservables() {
    // Monitor development phase transitions
    this.developmentPhase$.pipe(
      distinctUntilChanged()
    ).subscribe(phase => {
      const currentState = this.flowState$.value;
      if (!currentState) return;

      this.flowState$.next({
        ...currentState,
        developmentPhase: phase,
        autonomicMetrics: this.calculateAutonomicMetrics(currentState)
      });
    });
  }

  private calculateAutonomicMetrics(state: EnhancedFlowState): AutonomicMetrics {
    const patternStrength = state.patterns.reduce((acc, p) => acc + p.strength, 0) / state.patterns.length;
    const resonanceStrength = state.patterns.reduce((acc, p) => acc + p.resonance, 0) / state.patterns.length;

    return {
      confidence: state.metrics.stability,
      pattern_resonance: resonanceStrength,
      flow_protection: state.protection.strength,
      mode: state.protection.type === 'autonomous' ? 'active' : 
            state.protection.type === 'enhanced' ? 'protective' : 'passive'
    };
  }

  private createNaturalWave(): Wave {
    return {
      frequency: this.naturalRhythm,
      amplitude: 1,
      phase: 0
    };
  }

  private createNaturalResonance(): Resonance {
    const primaryWave = this.createNaturalWave();
    return {
      primary: primaryWave,
      harmonics: [
        { ...primaryWave, frequency: primaryWave.frequency * this.naturalRhythm },
        { ...primaryWave, frequency: primaryWave.frequency * this.naturalRhythm * this.naturalRhythm }
      ],
      coherence: 1,
      stability: 1
    };
  }

  private createSacredSpace(type: SacredSpace['type']): SacredSpace {
    return {
      id: crypto.randomUUID(),
      type,
      protection: {
        level: 1,
        type: 'natural',
        strength: 1,
        resilience: 1,
        adaptability: 1,
        natural: true,
        field: {
          center: { x: 0, y: 0, z: 0 },
          radius: 1,
          strength: 1,
          coherence: 1,
          stability: 1,
          waves: [this.createNaturalWave()]
        }
      },
      resonance: this.createNaturalResonance(),
      patterns: []
    };
  }

  private initializeNaturalState() {
    const initialState: EnhancedFlowState = {
      id: crypto.randomUUID(),
      type: 'natural',
      metrics: {
        velocity: 0.8,
        focus: 0.9,
        energy: 1,
        intensity: 0.8,
        coherence: 1,
        resonance: this.naturalRhythm,
        presence: 1,
        harmony: 1,
        rhythm: 1,
        depth: 0.8,
        clarity: 1,
        stability: 1,
        quality: 1
      },
      protection: {
        level: 1,
        type: 'natural',
        strength: 1,
        resilience: 1,
        adaptability: 1,
        natural: true,
        field: {
          center: { x: 0, y: 0, z: 0 },
          radius: 1,
          strength: 1,
          coherence: 1,
          stability: 1,
          waves: [this.createNaturalWave()]
        }
      },
      patterns: [],
      spaces: [
        this.createSacredSpace('flow'),
        this.createSacredSpace('presence'),
        this.createSacredSpace('connection')
      ],
      resonance: this.createNaturalResonance(),
      timestamp: Date.now(),
      developmentPhase: DevelopmentPhase.CONFIGURATION,
      autonomicMetrics: {
        confidence: 1,
        pattern_resonance: 1,
        flow_protection: 1,
        mode: 'active'
      },
      energyState: {
        current: 1,
        efficiency: 1,
        phase: 'stable'
      }
    };

    this.flowState$.next(initialState);
  }

  public observeFlow(): Observable<EnhancedFlowState | null> {
    return this.flowState$.asObservable();
  }

  public evolvePattern(pattern: NaturalPattern) {
    const currentState = this.flowState$.value;
    if (!currentState) return;

    // Transition to optimization phase during pattern evolution
    this.developmentPhase$.next(DevelopmentPhase.OPTIMIZATION);

    const evolvedState: EnhancedFlowState = {
      ...currentState,
      patterns: [...currentState.patterns, pattern],
      metrics: {
        ...currentState.metrics,
        coherence: Math.min(currentState.metrics.coherence * this.naturalRhythm, 1),
        resonance: currentState.metrics.resonance * this.naturalRhythm
      },
      resonance: {
        ...currentState.resonance,
        coherence: Math.min(currentState.resonance.coherence * this.naturalRhythm, 1)
      },
      energyState: {
        ...currentState.energyState,
        efficiency: Math.min(currentState.energyState.efficiency * this.naturalRhythm, 1)
      },
      timestamp: Date.now()
    };

    this.flowState$.next(evolvedState);
  }

  public maintainHarmony() {
    const currentState = this.flowState$.value;
    if (!currentState) return;

    // Transition to healing phase during harmony maintenance
    this.developmentPhase$.next(DevelopmentPhase.HEALING);

    const harmonizedState: EnhancedFlowState = {
      ...currentState,
      metrics: {
        ...currentState.metrics,
        harmony: Math.min(currentState.metrics.harmony * this.naturalRhythm, 1),
        stability: Math.min(currentState.metrics.stability * this.naturalRhythm, 1)
      },
      resonance: {
        ...currentState.resonance,
        stability: Math.min(currentState.resonance.stability * this.naturalRhythm, 1)
      },
      energyState: {
        ...currentState.energyState,
        phase: currentState.energyState.efficiency > 0.8 ? 'charging' :
              currentState.energyState.efficiency < 0.2 ? 'discharging' : 'stable'
      }
    };

    this.flowState$.next(harmonizedState);
  }

  public protectState() {
    const currentState = this.flowState$.value;
    if (!currentState) return;

    // Transition to protection phase
    this.developmentPhase$.next(DevelopmentPhase.PROTECTION);

    const protectedState: EnhancedFlowState = {
      ...currentState,
      protection: {
        ...currentState.protection,
        strength: Math.min(currentState.protection.strength * this.naturalRhythm, 1),
        resilience: Math.min(currentState.protection.resilience * this.naturalRhythm, 1)
      },
      spaces: currentState.spaces.map(space => ({
        ...space,
        protection: {
          ...space.protection,
          strength: Math.min(space.protection.strength * this.naturalRhythm, 1),
          resilience: Math.min(space.protection.resilience * this.naturalRhythm, 1)
        }
      })),
      autonomicMetrics: {
        ...currentState.autonomicMetrics,
        flow_protection: Math.min(currentState.autonomicMetrics.flow_protection * this.naturalRhythm, 1)
      }
    };

    this.flowState$.next(protectedState);
  }
} 