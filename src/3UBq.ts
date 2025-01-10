import { Observable, Subject, combineLatest } from 'rxjs';
import { map, filter, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FlowSpace, NaturalFlow } from '../types';

/**
 * SpaceGrowth manages the natural development and deepening of spaces,
 * maintaining proper order while protecting inner sanctity.
 */
export class SpaceGrowth {
  private growth = new Subject<{
    space: FlowSpace;
    type: 'deepening' | 'purification' | 'illumination';
    intensity: number;
  }>();

  // Growth Observation
  public observeGrowth(spaceId: string): Observable<{
    type: 'deepening' | 'purification' | 'illumination';
    intensity: number;
    timestamp: number;
  }[]> {
    return this.growth.pipe(
      filter(g => g.space.id === spaceId),
      map(g => [{
        type: g.type,
        intensity: g.intensity,
        timestamp: Date.now()
      }]),
      distinctUntilChanged()
    );
  }

  // Natural Development
  public async deepen(
    space: FlowSpace,
    intensity: number = 0.1
  ): Promise<{
    flow: NaturalFlow;
    depth: number;
  }> {
    // Verify readiness
    if (!this.canDeepen(space)) {
      return {
        flow: space.flow,
        depth: space.depth
      };
    }

    // Calculate natural growth
    const flow = this.evolveFlow(space.flow, intensity);
    const depth = Math.min(1, space.depth + intensity * this.calculateDepthMultiplier(space));

    // Record growth
    this.growth.next({
      space,
      type: 'deepening',
      intensity
    });

    return { flow, depth };
  }

  // Inner Purification
  public async purify(
    space: FlowSpace,
    intensity: number = 0.1
  ): Promise<{
    flow: NaturalFlow;
    depth: number;
  }> {
    // Verify readiness
    if (!this.canPurify(space)) {
      return {
        flow: space.flow,
        depth: space.depth
      };
    }

    // Calculate purification
    const flow = this.purifyFlow(space.flow, intensity);
    const depth = Math.min(1, space.depth + intensity * 0.5);

    // Record growth
    this.growth.next({
      space,
      type: 'purification',
      intensity
    });

    return { flow, depth };
  }

  // Illumination
  public async illuminate(
    space: FlowSpace,
    intensity: number = 0.1
  ): Promise<{
    flow: NaturalFlow;
    depth: number;
  }> {
    // Verify readiness
    if (!this.canIlluminate(space)) {
      return {
        flow: space.flow,
        depth: space.depth
      };
    }

    // Calculate illumination
    const flow = this.illuminateFlow(space.flow, intensity);
    const depth = Math.min(1, space.depth + intensity * 0.3);

    // Record growth
    this.growth.next({
      space,
      type: 'illumination',
      intensity
    });

    return { flow, depth };
  }

  // Protected Verifications
  private canDeepen(space: FlowSpace): boolean {
    return (
      space.flow.presence > 0.3 &&
      space.flow.coherence > 0.3
    );
  }

  private canPurify(space: FlowSpace): boolean {
    return (
      space.flow.coherence > 0.4 &&
      space.depth > 0.3
    );
  }

  private canIlluminate(space: FlowSpace): boolean {
    return (
      space.flow.presence > 0.5 &&
      space.flow.coherence > 0.5 &&
      space.depth > 0.5
    );
  }

  // Protected Calculations
  private calculateDepthMultiplier(space: FlowSpace): number {
    const baseMultiplier = 1;
    const presenceBonus = space.flow.presence > 0.7 ? 0.3 : 0;
    const coherenceBonus = space.flow.coherence > 0.7 ? 0.3 : 0;
    return baseMultiplier + presenceBonus + coherenceBonus;
  }

  private evolveFlow(flow: NaturalFlow, intensity: number): NaturalFlow {
    return {
      presence: Math.min(1, flow.presence + intensity * 0.2),
      harmony: Math.min(1, flow.harmony + intensity * 0.1),
      energy: flow.energy,
      focus: flow.focus
    };
  }

  private purifyFlow(flow: NaturalFlow, intensity: number): NaturalFlow {
    return {
      presence: Math.min(1, flow.presence + intensity * 0.1),
      harmony: Math.min(1, flow.harmony + intensity * 0.2),
      energy: flow.energy,
      focus: flow.focus
    };
  }

  private illuminateFlow(flow: NaturalFlow, intensity: number): NaturalFlow {
    return {
      presence: Math.min(1, flow.presence + intensity * 0.3),
      harmony: Math.min(1, flow.harmony + intensity * 0.2),
      energy: flow.energy,
      focus: flow.focus
    };
  }
} 