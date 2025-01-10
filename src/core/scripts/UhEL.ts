import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { FlowContext, FlowProtection, NaturalFlowType, FlowMetrics, FlowState } from '../types/base';

// Natural proportions for harmonious timing
const NATURAL_PROPORTIONS = {
  PRIMARY: 0.618033988749895,    // Golden ratio
  SECONDARY: 0.414213562373095,  // Silver ratio
  FOUNDATIONAL: 0.302775637731995 // Bronze ratio
};

// Natural cycles for rhythm alignment
const FLOW_CYCLES = {
  BREATH: 5000,  // ms
  PRESENCE: 8000, // ms
  HARMONY: 13000  // ms
};

export interface HyperfocusMetrics extends FlowMetrics {
  intensity: number;
  duration: number;
  contextRetention: number;
  depth: number;
  clarity: number;
  stability: number;
  focus: number;
  energy: number;
  quality: number;
  coherence: number;
  resonance: number;
  presence: number;
  harmony: number;
  rhythm: number;
  alignment: number;
  flow: number;
}

export class FlowStateGuardian {
  private contexts: Map<string, BehaviorSubject<FlowContext>> = new Map();
  private protections: Map<string, BehaviorSubject<FlowProtection>> = new Map();
  private hyperfocusStates: Map<string, BehaviorSubject<HyperfocusMetrics>> = new Map();
  
  private readonly HYPERFOCUS_THRESHOLD = NATURAL_PROPORTIONS.PRIMARY;
  private readonly CONTEXT_DECAY_RATE = NATURAL_PROPORTIONS.FOUNDATIONAL;
  private readonly MIN_HYPERFOCUS_DURATION = 25; // minutes

  createContext(): string {
    const id = Math.random().toString(36).substring(7);
    this.contexts.set(id, new BehaviorSubject<FlowContext>({
      id,
      depth: NATURAL_PROPORTIONS.PRIMARY,
      metrics: {
        coherence: NATURAL_PROPORTIONS.PRIMARY,
        stability: NATURAL_PROPORTIONS.SECONDARY,
        quality: NATURAL_PROPORTIONS.PRIMARY
      },
      mode: 'natural'
    }));
    
    this.protections.set(id, new BehaviorSubject<FlowProtection>({
      level: NATURAL_PROPORTIONS.PRIMARY,
      type: 'soft'
    }));

    this.hyperfocusStates.set(id, new BehaviorSubject<HyperfocusMetrics>({
      intensity: 0,
      duration: 0,
      contextRetention: 1,
      depth: NATURAL_PROPORTIONS.PRIMARY,
      clarity: NATURAL_PROPORTIONS.PRIMARY,
      stability: NATURAL_PROPORTIONS.SECONDARY,
      focus: NATURAL_PROPORTIONS.PRIMARY,
      energy: NATURAL_PROPORTIONS.PRIMARY,
      quality: NATURAL_PROPORTIONS.PRIMARY,
      coherence: NATURAL_PROPORTIONS.PRIMARY,
      resonance: NATURAL_PROPORTIONS.SECONDARY,
      presence: NATURAL_PROPORTIONS.PRIMARY,
      harmony: NATURAL_PROPORTIONS.PRIMARY,
      rhythm: NATURAL_PROPORTIONS.PRIMARY,
      alignment: NATURAL_PROPORTIONS.PRIMARY,
      flow: NATURAL_PROPORTIONS.PRIMARY
    }));

    this.initializeHyperfocusTracking(id);
    return id;
  }

  private initializeHyperfocusTracking(contextId: string) {
    const context = this.contexts.get(contextId);
    const hyperfocus = this.hyperfocusStates.get(contextId);
    
    if (!context || !hyperfocus) return;

    combineLatest([
      context,
      hyperfocus
    ]).pipe(
      debounceTime(FLOW_CYCLES.BREATH),
      map(([ctx, hyper]) => this.evaluateHyperfocus(ctx, hyper))
    ).subscribe(metrics => {
      hyperfocus.next(metrics);
      this.adjustProtection(contextId, metrics);
    });
  }

  private evaluateHyperfocus(context: FlowContext, current: HyperfocusMetrics): HyperfocusMetrics {
    const newIntensity = this.calculateIntensity(context);
    const isHyperfocus = newIntensity > this.HYPERFOCUS_THRESHOLD;
    
    return {
      ...current,
      intensity: newIntensity,
      duration: isHyperfocus ? current.duration + 1 : 0,
      contextRetention: this.updateContextRetention(current.contextRetention),
      coherence: context.metrics.coherence,
      stability: context.metrics.stability,
      quality: context.metrics.quality,
      depth: context.depth,
      clarity: current.clarity * (isHyperfocus ? NATURAL_PROPORTIONS.PRIMARY : NATURAL_PROPORTIONS.SECONDARY),
      focus: newIntensity * current.contextRetention,
      energy: current.energy * (isHyperfocus ? NATURAL_PROPORTIONS.SECONDARY : NATURAL_PROPORTIONS.PRIMARY),
      resonance: current.resonance * (isHyperfocus ? NATURAL_PROPORTIONS.PRIMARY : NATURAL_PROPORTIONS.SECONDARY),
      presence: current.presence * (isHyperfocus ? NATURAL_PROPORTIONS.PRIMARY : NATURAL_PROPORTIONS.SECONDARY),
      harmony: current.harmony * (isHyperfocus ? NATURAL_PROPORTIONS.PRIMARY : NATURAL_PROPORTIONS.SECONDARY),
      rhythm: current.rhythm * (isHyperfocus ? NATURAL_PROPORTIONS.PRIMARY : NATURAL_PROPORTIONS.SECONDARY),
      alignment: this.calculateAlignment(current),
      flow: this.calculateFlow(current, isHyperfocus)
    };
  }

  private calculateAlignment(metrics: HyperfocusMetrics): number {
    return (metrics.presence * metrics.harmony * metrics.rhythm) ** (1/3);
  }

  private calculateFlow(metrics: HyperfocusMetrics, isHyperfocus: boolean): number {
    const base = (metrics.clarity * metrics.resonance * metrics.alignment) ** (1/3);
    return isHyperfocus ? base * NATURAL_PROPORTIONS.PRIMARY : base * NATURAL_PROPORTIONS.SECONDARY;
  }

  private calculateIntensity(context: FlowContext): number {
    return (
      context.metrics.coherence * NATURAL_PROPORTIONS.PRIMARY +
      context.metrics.stability * NATURAL_PROPORTIONS.SECONDARY +
      context.metrics.quality * NATURAL_PROPORTIONS.FOUNDATIONAL
    ) / (NATURAL_PROPORTIONS.PRIMARY + NATURAL_PROPORTIONS.SECONDARY + NATURAL_PROPORTIONS.FOUNDATIONAL);
  }

  private updateContextRetention(current: number): number {
    return Math.max(0, current - this.CONTEXT_DECAY_RATE);
  }

  private adjustProtection(contextId: string, metrics: HyperfocusMetrics) {
    const protection = this.protections.get(contextId);
    if (!protection) return;

    const isDeepHyperfocus = metrics.intensity > this.HYPERFOCUS_THRESHOLD && 
                            metrics.duration >= this.MIN_HYPERFOCUS_DURATION &&
                            metrics.alignment > NATURAL_PROPORTIONS.SECONDARY;

    protection.next({
      level: isDeepHyperfocus ? NATURAL_PROPORTIONS.PRIMARY : NATURAL_PROPORTIONS.SECONDARY,
      type: isDeepHyperfocus ? 'hard' : 'soft'
    });
  }

  setMode(contextId: string, mode: NaturalFlowType): void {
    const context = this.contexts.get(contextId);
    if (context) {
      context.next({
        ...context.value,
        mode
      });
    }
  }

  observeContext(contextId: string): Observable<FlowContext> {
    return this.contexts.get(contextId) as Observable<FlowContext>;
  }

  observeProtection(contextId: string): Observable<FlowProtection> {
    return this.protections.get(contextId) as Observable<FlowProtection>;
  }

  observeHyperfocus(contextId: string): Observable<HyperfocusMetrics> {
    return this.hyperfocusStates.get(contextId) as Observable<HyperfocusMetrics>;
  }

  public getCurrentState(): FlowState {
    return {
      id: "main",
      type: "natural",
      metrics: {
        depth: 0,
        clarity: 0,
        stability: 0,
        focus: 0,
        energy: 0,
        quality: 0,
        intensity: 0,
        coherence: 0,
        resonance: 0,
        presence: 0,
        harmony: 0,
        rhythm: 0
      },
      protection: {
        level: 0,
        type: "natural",
        strength: 0
      },
      timestamp: Date.now()
    };
  }
} 