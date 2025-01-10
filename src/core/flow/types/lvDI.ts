import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { AutonomicSystem } from '../autonomic/Autonomic';

export type SpaceType = 'sanctuary' | 'library' | 'garden' | 'workshop' | 'commons';

interface SpaceState {
  type: SpaceType;
  stillness: number;
  presence: number;
  resonance: number;
  protection: number;
}

interface TransitionMetrics {
  naturalness: number;
  harmony: number;
  stability: number;
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
    const newStillness = (presence.depth * 0.7 + flow.harmony * 0.3);
    const newPresence = (presence.presence * 0.6 + flow.quality * 0.4);
    const newResonance = (presence.resonance * 0.5 + flow.harmony * 0.5);
    const newProtection = (presence.depth * 0.4 + flow.sustainability * 0.6);

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

  private suggestNaturalSpace(
    stillness: number,
    presence: number,
    resonance: number
  ): SpaceType {
    // Natural space suggestion based on current state
    if (stillness > 0.8 && presence > 0.7) return 'sanctuary';
    if (stillness > 0.7 && resonance > 0.6) return 'library';
    if (resonance > 0.8 && presence > 0.6) return 'garden';
    if (presence > 0.7 && resonance > 0.5) return 'workshop';
    return 'commons';
  }

  private initiateTransition(
    targetSpace: SpaceType,
    metrics: Omit<SpaceState, 'type'>
  ) {
    const currentSpace = this.currentSpace$.value;
    
    // Calculate transition metrics
    const naturalness = this.calculateTransitionNaturalness(currentSpace.type, targetSpace);
    const harmony = (metrics.stillness + metrics.resonance) / 2;
    const stability = (metrics.presence + metrics.protection) / 2;

    // Update transition metrics
    this.transitionMetrics$.next({
      naturalness,
      harmony,
      stability
    });

    // Perform the transition
    this.currentSpace$.next({
      type: targetSpace,
      ...metrics
    });
  }

  private calculateTransitionNaturalness(
    from: SpaceType,
    to: SpaceType
  ): number {
    const naturalPaths: Record<SpaceType, SpaceType[]> = {
      sanctuary: ['library', 'garden'],
      library: ['sanctuary', 'garden', 'workshop'],
      garden: ['sanctuary', 'library', 'workshop', 'commons'],
      workshop: ['library', 'garden', 'commons'],
      commons: ['garden', 'workshop']
    };

    return naturalPaths[from].includes(to) ? 0.8 : 0.4;
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

    if (metrics.naturalness < 0.5) {
      insights.push('Space transition feels unnatural');
    }

    if (metrics.harmony < 0.6) {
      insights.push('Space harmony needs attention');
    }

    if (metrics.stability < 0.5) {
      insights.push('Space stability requires strengthening');
    }

    if (space.protection < 0.4 && 
        (space.type === 'sanctuary' || space.type === 'library')) {
      insights.push('Deep space protection insufficient');
    }

    return {
      isValid: insights.length === 0 && 
               metrics.naturalness > 0.6 && 
               metrics.harmony > 0.5 && 
               metrics.stability > 0.5,
      insights
    };
  }
} 