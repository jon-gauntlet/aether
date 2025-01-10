import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { FlowContext, FlowProtection, NaturalFlowType, FlowMetrics } from '../types/base';

// Sacred proportions for divine timing
const DIVINE_PROPORTIONS = {
  GOLDEN_RATIO: 0.618033988749895,
  SILVER_RATIO: 0.414213562373095,
  BRONZE_RATIO: 0.302775637731995
};

// Prayer cycles for rhythm alignment
const PRAYER_CYCLES = {
  JESUS_PRAYER: 5000, // ms
  PRESENCE: 8000,     // ms
  HARMONY: 13000      // ms
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
  prayerAlignment: number;
  graceFlow: number;
}

export class FlowStateGuardian {
  private contexts: Map<string, BehaviorSubject<FlowContext>> = new Map();
  private protections: Map<string, BehaviorSubject<FlowProtection>> = new Map();
  private hyperfocusStates: Map<string, BehaviorSubject<HyperfocusMetrics>> = new Map();
  
  private readonly HYPERFOCUS_THRESHOLD = DIVINE_PROPORTIONS.GOLDEN_RATIO;
  private readonly CONTEXT_DECAY_RATE = DIVINE_PROPORTIONS.BRONZE_RATIO;
  private readonly MIN_HYPERFOCUS_DURATION = 25; // minutes

  createContext(): string {
    const id = Math.random().toString(36).substring(7);
    this.contexts.set(id, new BehaviorSubject<FlowContext>({
      depth: DIVINE_PROPORTIONS.GOLDEN_RATIO,
      metrics: {
        coherence: DIVINE_PROPORTIONS.GOLDEN_RATIO,
        stability: DIVINE_PROPORTIONS.SILVER_RATIO,
        quality: DIVINE_PROPORTIONS.GOLDEN_RATIO
      },
      mode: 'natural'
    }));
    
    this.protections.set(id, new BehaviorSubject<FlowProtection>({
      level: DIVINE_PROPORTIONS.GOLDEN_RATIO,
      type: 'soft'
    }));

    this.hyperfocusStates.set(id, new BehaviorSubject<HyperfocusMetrics>({
      intensity: 0,
      duration: 0,
      contextRetention: 1,
      depth: DIVINE_PROPORTIONS.GOLDEN_RATIO,
      clarity: DIVINE_PROPORTIONS.GOLDEN_RATIO,
      stability: DIVINE_PROPORTIONS.SILVER_RATIO,
      focus: DIVINE_PROPORTIONS.GOLDEN_RATIO,
      energy: DIVINE_PROPORTIONS.GOLDEN_RATIO,
      quality: DIVINE_PROPORTIONS.GOLDEN_RATIO,
      coherence: DIVINE_PROPORTIONS.GOLDEN_RATIO,
      resonance: DIVINE_PROPORTIONS.SILVER_RATIO,
      presence: DIVINE_PROPORTIONS.GOLDEN_RATIO,
      harmony: DIVINE_PROPORTIONS.GOLDEN_RATIO,
      rhythm: DIVINE_PROPORTIONS.GOLDEN_RATIO,
      prayerAlignment: DIVINE_PROPORTIONS.GOLDEN_RATIO,
      graceFlow: DIVINE_PROPORTIONS.GOLDEN_RATIO
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
      debounceTime(PRAYER_CYCLES.JESUS_PRAYER),
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
      clarity: current.clarity * (isHyperfocus ? DIVINE_PROPORTIONS.GOLDEN_RATIO : DIVINE_PROPORTIONS.SILVER_RATIO),
      focus: newIntensity * current.contextRetention,
      energy: current.energy * (isHyperfocus ? DIVINE_PROPORTIONS.SILVER_RATIO : DIVINE_PROPORTIONS.GOLDEN_RATIO),
      resonance: current.resonance * (isHyperfocus ? DIVINE_PROPORTIONS.GOLDEN_RATIO : DIVINE_PROPORTIONS.SILVER_RATIO),
      presence: current.presence * (isHyperfocus ? DIVINE_PROPORTIONS.GOLDEN_RATIO : DIVINE_PROPORTIONS.SILVER_RATIO),
      harmony: current.harmony * (isHyperfocus ? DIVINE_PROPORTIONS.GOLDEN_RATIO : DIVINE_PROPORTIONS.SILVER_RATIO),
      rhythm: current.rhythm * (isHyperfocus ? DIVINE_PROPORTIONS.GOLDEN_RATIO : DIVINE_PROPORTIONS.SILVER_RATIO),
      prayerAlignment: this.calculatePrayerAlignment(current),
      graceFlow: this.calculateGraceFlow(current, isHyperfocus)
    };
  }

  private calculatePrayerAlignment(metrics: HyperfocusMetrics): number {
    return (metrics.presence * metrics.harmony * metrics.rhythm) ** (1/3);
  }

  private calculateGraceFlow(metrics: HyperfocusMetrics, isHyperfocus: boolean): number {
    const base = (metrics.clarity * metrics.resonance * metrics.prayerAlignment) ** (1/3);
    return isHyperfocus ? base * DIVINE_PROPORTIONS.GOLDEN_RATIO : base * DIVINE_PROPORTIONS.SILVER_RATIO;
  }

  private calculateIntensity(context: FlowContext): number {
    return (
      context.metrics.coherence * DIVINE_PROPORTIONS.GOLDEN_RATIO +
      context.metrics.stability * DIVINE_PROPORTIONS.SILVER_RATIO +
      context.metrics.quality * DIVINE_PROPORTIONS.BRONZE_RATIO
    ) / (DIVINE_PROPORTIONS.GOLDEN_RATIO + DIVINE_PROPORTIONS.SILVER_RATIO + DIVINE_PROPORTIONS.BRONZE_RATIO);
  }

  private updateContextRetention(current: number): number {
    return Math.max(0, current - this.CONTEXT_DECAY_RATE);
  }

  private adjustProtection(contextId: string, metrics: HyperfocusMetrics) {
    const protection = this.protections.get(contextId);
    if (!protection) return;

    const isDeepHyperfocus = metrics.intensity > this.HYPERFOCUS_THRESHOLD && 
                            metrics.duration >= this.MIN_HYPERFOCUS_DURATION &&
                            metrics.prayerAlignment > DIVINE_PROPORTIONS.SILVER_RATIO;

    protection.next({
      level: isDeepHyperfocus ? DIVINE_PROPORTIONS.GOLDEN_RATIO : DIVINE_PROPORTIONS.SILVER_RATIO,
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
} 