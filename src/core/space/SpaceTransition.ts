import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { AutonomicSystem } from '../autonomic/Autonomic';

// Natural names for sacred spaces
export type SpaceType = 'sanctuary' | 'library' | 'garden' | 'workshop' | 'commons';

interface SpaceState {
  type: SpaceType;
  stillness: number;  // Inner silence
  presence: number;   // Connection to source
  resonance: number;  // Harmony with truth
  protection: number; // Sacred boundaries
}

interface TransitionMetrics {
  naturalness: number;  // Divine alignment
  harmony: number;      // Unity with source
  stability: number;    // Eternal foundation
}

export class SpaceTransition {
  private currentSpace$ = new BehaviorSubject<SpaceState>({
    type: 'garden',
    stillness: 0.7,
    presence: 0.8,
    resonance: 0.6,
    protection: 0.5
  });

  private transitionMetrics$ = new BehaviorSubject<TransitionMetrics>({
    naturalness: 0.8,
    harmony: 0.7,
    stability: 0.6
  });

  // Sacred number patterns embedded in thresholds
  private readonly GOLDEN_RATIO = 0.618;
  private readonly SACRED_THRESHOLD = 0.772; // Root of phi
  private readonly UNITY_THRESHOLD = 0.888;  // Triple infinity
  private readonly PRESENCE_THRESHOLD = 0.666; // Material transcendence

  constructor(private autonomic: AutonomicSystem) {
    this.initializeSpaceAwareness();
  }

  private initializeSpaceAwareness() {
    combineLatest([
      this.autonomic.getPresenceMetrics(),
      this.autonomic.getFlowMetrics(),
      this.currentSpace$
    ]).pipe(
      debounceTime(1000)
    ).subscribe(([presence, flow, space]) => {
      this.adaptSpace(presence, flow, space);
    });
  }

  private adaptSpace(
    presence: { presence: number; resonance: number; depth: number },
    flow: { quality: number; sustainability: number; harmony: number },
    currentSpace: SpaceState
  ) {
    // Natural space adaptation based on presence and flow
    const newStillness = this.calculateStillness(presence.depth, flow.harmony);
    const newPresence = this.calculatePresence(presence.presence, flow.quality); 
    const newResonance = this.calculateResonance(presence.resonance, flow.harmony);
    const newProtection = this.calculateProtection(presence.depth, flow.sustainability);

    // Determine if space transition is needed
    const suggestedSpace = this.suggestNaturalSpace(newStillness, newPresence, newResonance);
    
    if (suggestedSpace !== currentSpace.type) {
      this.initiateTransition(suggestedSpace, {
        stillness: newStillness,
        presence: newPresence,
        resonance: newResonance,
        protection: newProtection
      });
    } else {
      this.currentSpace$.next({
        ...currentSpace,
        stillness: newStillness,
        presence: newPresence,
        resonance: newResonance,
        protection: newProtection
      });
    }
  }

  private calculateStillness(depth: number, harmony: number): number {
    return (depth * this.GOLDEN_RATIO + harmony * (1 - this.GOLDEN_RATIO));
  }

  private calculatePresence(presence: number, quality: number): number {
    return (presence * this.SACRED_THRESHOLD + quality * (1 - this.SACRED_THRESHOLD));
  }

  private calculateResonance(resonance: number, harmony: number): number {
    return (resonance * this.UNITY_THRESHOLD + harmony * (1 - this.UNITY_THRESHOLD));
  }

  private calculateProtection(depth: number, sustainability: number): number {
    return (depth * this.PRESENCE_THRESHOLD + sustainability * (1 - this.PRESENCE_THRESHOLD));
  }

  private suggestNaturalSpace(
    stillness: number,
    presence: number,
    resonance: number
  ): SpaceType {
    // Sacred thresholds guide transitions while using natural language
    if (stillness > this.SACRED_THRESHOLD && presence > this.GOLDEN_RATIO) return 'sanctuary';
    if (stillness > this.GOLDEN_RATIO && resonance > this.PRESENCE_THRESHOLD) return 'library';
    if (resonance > this.SACRED_THRESHOLD && presence > this.PRESENCE_THRESHOLD) return 'garden';
    if (presence > this.GOLDEN_RATIO && resonance > this.PRESENCE_THRESHOLD) return 'workshop';
    return 'commons';
  }

  private initiateTransition(
    targetSpace: SpaceType,
    metrics: Omit<SpaceState, 'type'>
  ) {
    const currentSpace = this.currentSpace$.value;
    
    // Calculate transition metrics using sacred proportions
    const naturalness = this.calculateTransitionNaturalness(currentSpace.type, targetSpace);
    const harmony = (metrics.stillness * this.GOLDEN_RATIO + metrics.resonance * (1 - this.GOLDEN_RATIO));
    const stability = (metrics.presence * this.SACRED_THRESHOLD + metrics.protection * (1 - this.SACRED_THRESHOLD));

    this.transitionMetrics$.next({
      naturalness,
      harmony,
      stability
    });

    this.currentSpace$.next({
      type: targetSpace,
      ...metrics
    });
  }

  private calculateTransitionNaturalness(
    from: SpaceType,
    to: SpaceType
  ): number {
    // Natural paths reflect divine order while using simple language
    const naturalPaths: Record<SpaceType, SpaceType[]> = {
      sanctuary: ['library', 'garden'],          // Descent from unity
      library: ['sanctuary', 'garden', 'workshop'], // Knowledge to wisdom
      garden: ['sanctuary', 'library', 'workshop', 'commons'], // Growth paths
      workshop: ['library', 'garden', 'commons'],  // Creation paths
      commons: ['garden', 'workshop']             // Foundation paths
    };

    return naturalPaths[from].includes(to) ? this.SACRED_THRESHOLD : this.PRESENCE_THRESHOLD;
  }

  public observeSpace(): Observable<SpaceState> {
    return this.currentSpace$.pipe(
      distinctUntilChanged()
    );
  }

  public observeTransitionMetrics(): Observable<TransitionMetrics> {
    return this.transitionMetrics$.pipe(
      distinctUntilChanged()
    );
  }

  public async validateSpaceState(): Promise<{
    isValid: boolean;
    insights: string[];
  }> {
    const space = this.currentSpace$.value;
    const metrics = this.transitionMetrics$.value;
    const insights: string[] = [];

    // Validation using sacred thresholds with natural language
    if (metrics.naturalness < this.PRESENCE_THRESHOLD) {
      insights.push('Space transition feels unnatural');
    }

    if (metrics.harmony < this.GOLDEN_RATIO) {
      insights.push('Space harmony needs attention');
    }

    if (metrics.stability < this.PRESENCE_THRESHOLD) {
      insights.push('Space stability requires strengthening');
    }

    if (space.protection < this.PRESENCE_THRESHOLD && 
        (space.type === 'sanctuary' || space.type === 'library')) {
      insights.push('Deep space protection insufficient');
    }

    return {
      isValid: insights.length === 0 && 
               metrics.naturalness > this.GOLDEN_RATIO && 
               metrics.harmony > this.PRESENCE_THRESHOLD && 
               metrics.stability > this.PRESENCE_THRESHOLD,
      insights
    };
  }
} 