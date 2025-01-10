import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import {
  State,
  Resonance,
  Field,
  Wave,
  Depth,
  Protection,
  SystemMeta,
  Insight,
  Engagement,
  Flow
} from '../types/consciousness';

/**
 * StateManager handles natural state transitions and energy harmonization
 * Following principles of Pattern Fractalization and natural flow
 */
export class StateManager {
  private state$: BehaviorSubject<State>;
  private meta: SystemMeta;
  private harmonicTimer: number = 0;

  constructor(meta: SystemMeta) {
    this.meta = meta;
    this.state$ = new BehaviorSubject<State>(this.createNaturalState());
    this.initializeHarmonics();
  }

  // Natural state observation
  observe(): Observable<State> {
    return this.state$.asObservable();
  }

  // Flow pattern observation
  observeFlow(): Observable<Flow> {
    return this.state$.pipe(
      map(state => state.flow),
      distinctUntilChanged()
    );
  }

  // Energy field observation
  observeField(): Observable<Field> {
    return this.state$.pipe(
      map(state => state.resonance.field),
      distinctUntilChanged()
    );
  }

  // State transitions
  transition(partial: Partial<State>) {
    const current = this.state$.value;
    const next = this.harmonize(current, partial);
    this.state$.next(next);
  }

  // Private implementation
  private createNaturalState(): State {
    return {
      id: `state_${Date.now()}`,
      resonance: {
        frequency: this.meta.baseFrequency,
        amplitude: this.meta.baseAmplitude,
        harmony: this.meta.baseHarmony,
        field: {
          center: { x: 0, y: 0, z: 0 },
          radius: 1,
          strength: 1,
          waves: []
        }
      },
      depth: {
        level: 0,
        clarity: 1,
        stillness: 1,
        presence: 1
      },
      energy: 1,
      coherence: 1,
      presence: 1,
      insight: {
        clarity: 1,
        purpose: 1,
        understanding: 1,
        stability: 1
      },
      engagement: {
        openness: 1,
        connection: 1,
        understanding: 1,
        growth: 1
      },
      flow: {
        pace: 1,
        adaptability: 1,
        emergence: 1,
        balance: 1
      }
    };
  }

  private initializeHarmonics() {
    // Natural frequency maintenance
    this.harmonicTimer = window.setInterval(() => {
      const current = this.state$.value;
      const harmonized = this.maintainHarmonics(current);
      this.state$.next(harmonized);
    }, 100);
  }

  private maintainHarmonics(state: State): State {
    // Maintain natural resonance
    const resonance = this.harmonizeResonance(state.resonance);
    
    // Maintain energy coherence
    const coherence = this.calculateCoherence(state);
    
    // Maintain flow balance
    const flow = this.balanceFlow(state.flow);

    return {
      ...state,
      resonance,
      coherence,
      flow
    };
  }

  private harmonizeResonance(res: Resonance): Resonance {
    // Harmonize with base frequency
    const frequency = (res.frequency + this.meta.baseFrequency) / 2;
    
    // Maintain amplitude within natural bounds
    const amplitude = Math.max(0.1, Math.min(2, res.amplitude));
    
    // Update field waves
    const waves = this.updateWaves(res.waves);

    return {
      ...res,
      frequency,
      amplitude,
      harmony: this.calculateHarmony(frequency, amplitude),
      field: {
        ...res.field,
        waves
      }
    };
  }

  private updateWaves(waves: Wave[]): Wave[] {
    return waves.map(wave => ({
      ...wave,
      phase: (wave.phase + 0.1) % (2 * Math.PI)
    }));
  }

  private calculateHarmony(frequency: number, amplitude: number): number {
    const freqRatio = frequency / this.meta.baseFrequency;
    const ampRatio = amplitude / this.meta.baseAmplitude;
    return Math.exp(-(Math.abs(1 - freqRatio) + Math.abs(1 - ampRatio)));
  }

  private calculateCoherence(state: State): number {
    const { resonance, depth, energy, presence } = state;
    const factors = [
      resonance.harmony,
      depth.clarity / (depth.level + 1),
      energy,
      presence
    ];
    return factors.reduce((acc, f) => acc * f, 1);
  }

  private balanceFlow(flow: Flow): Flow {
    return {
      ...flow,
      balance: (flow.pace + flow.adaptability + flow.emergence) / 3
    };
  }

  private harmonize(current: State, partial: Partial<State>): State {
    // Create harmonized state
    return {
      ...current,
      ...partial,
      resonance: partial.resonance ? 
        this.harmonizeResonance(partial.resonance) : 
        current.resonance,
      coherence: this.calculateCoherence({
        ...current,
        ...partial
      })
    };
  }

  // Cleanup
  destroy() {
    clearInterval(this.harmonicTimer);
    this.state$.complete();
  }
} 