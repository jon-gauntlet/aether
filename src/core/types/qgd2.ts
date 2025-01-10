import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, distinctUntilChanged, filter } from 'rxjs/operators';

export interface FlowState {
  intensity: number;
  coherence: number;
  resonance: number;
  protection: number;
}

export interface FlowMetrics {
  depth: number;
  breadth: number;
  stability: number;
}

export class NaturalFlow {
  private flowState$ = new BehaviorSubject<FlowState>({
    intensity: 0.618033988749895,  // Golden ratio - natural balance
    coherence: 0.414213562373095,  // Silver ratio - stability
    resonance: 0.302775637731995,  // Bronze ratio - foundation
    protection: 1
  });

  private metrics$ = new BehaviorSubject<FlowMetrics>({
    depth: 0,
    breadth: 0,
    stability: 0
  });

  // Natural timing cycles (ms)
  private readonly BREATH_CYCLE = 5000;
  private readonly PRESENCE_CYCLE = 8000;
  private readonly HARMONY_CYCLE = 13000;

  constructor() {
    this.initializeNaturalCycles();
  }

  private initializeNaturalCycles(): void {
    // Breath cycle - basic rhythm
    setInterval(() => {
      const current = this.flowState$.value;
      this.flowState$.next({
        ...current,
        resonance: Math.sin(Date.now() / this.BREATH_CYCLE) * 0.1 + current.resonance
      });
    }, this.BREATH_CYCLE / 10);

    // Presence cycle - deeper rhythm
    setInterval(() => {
      const current = this.flowState$.value;
      this.flowState$.next({
        ...current,
        coherence: Math.sin(Date.now() / this.PRESENCE_CYCLE) * 0.15 + current.coherence
      });
    }, this.PRESENCE_CYCLE / 10);

    // Harmony cycle - system-wide rhythm
    setInterval(() => {
      const current = this.flowState$.value;
      this.flowState$.next({
        ...current,
        intensity: Math.sin(Date.now() / this.HARMONY_CYCLE) * 0.2 + current.intensity
      });
    }, this.HARMONY_CYCLE / 10);
  }

  // Flow state protection
  public protectFlow(intensity: number): void {
    const current = this.flowState$.value;
    this.flowState$.next({
      ...current,
      protection: Math.max(0, Math.min(1, intensity))
    });
  }

  // Natural metrics evolution
  public evolveMetrics(metrics: Partial<FlowMetrics>): void {
    const current = this.metrics$.value;
    this.metrics$.next({
      ...current,
      ...metrics
    });
  }

  // Flow state observation
  public observeFlow(): Observable<FlowState> {
    return this.flowState$.asObservable();
  }

  // Metrics observation
  public observeMetrics(): Observable<FlowMetrics> {
    return this.metrics$.asObservable();
  }

  // Flow quality monitoring
  public observeQuality(): Observable<number> {
    return combineLatest([
      this.flowState$,
      this.metrics$
    ]).pipe(
      map(([flow, metrics]) => {
        return (
          flow.intensity * 0.3 +
          flow.coherence * 0.3 +
          flow.resonance * 0.2 +
          metrics.stability * 0.2
        );
      }),
      distinctUntilChanged(),
      filter(quality => quality >= 0 && quality <= 1)
    );
  }

  // Flow protection monitoring
  public observeProtection(): Observable<boolean> {
    return this.flowState$.pipe(
      map(state => state.protection > 0.8),
      distinctUntilChanged()
    );
  }
} 