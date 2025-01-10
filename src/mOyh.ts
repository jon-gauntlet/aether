import { Observable, Subject, combineLatest } from 'rxjs';
import { map, filter, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FlowSpace, NaturalFlow, Connection } from '../types/consciousness';

/**
 * SpaceInteractions manages the natural relationships and interactions
 * between spaces, maintaining harmony while protecting boundaries.
 */
export class SpaceInteractions {
  private interactions = new Subject<{
    source: FlowSpace;
    target: FlowSpace;
    type: 'flow' | 'resonance' | 'presence';
    strength: number;
  }>();

  // Interaction Observation
  public observeInteractions(spaceId: string): Observable<{
    space: FlowSpace;
    type: 'flow' | 'resonance' | 'presence';
    strength: number;
  }[]> {
    return this.interactions.pipe(
      filter(i => i.source.id === spaceId || i.target.id === spaceId),
      map(i => [{
        space: i.source.id === spaceId ? i.target : i.source,
        type: i.type,
        strength: i.strength
      }]),
      distinctUntilChanged()
    );
  }

  // Natural Flow
  public async flowBetween(
    source: FlowSpace,
    target: FlowSpace,
    intensity: number = 0.1
  ): Promise<{
    sourceFlow: NaturalFlow;
    targetFlow: NaturalFlow;
    strength: number;
  }> {
    // Calculate natural resonance
    const resonance = this.calculateResonance(source.flow, target.flow);
    
    // Only flow if sufficient resonance
    if (resonance < 0.3) {
      return {
        sourceFlow: source.flow,
        targetFlow: target.flow,
        strength: 0
      };
    }

    // Calculate harmonized flows
    const sourceFlow = this.evolveFlow(source.flow, target.flow, intensity * resonance);
    const targetFlow = this.evolveFlow(target.flow, source.flow, intensity * resonance);
    
    // Record interaction
    this.interactions.next({
      source,
      target,
      type: 'flow',
      strength: resonance
    });

    return {
      sourceFlow,
      targetFlow,
      strength: resonance
    };
  }

  // Resonant Connection
  public async resonate(
    source: FlowSpace,
    target: FlowSpace,
    intensity: number = 0.1
  ): Promise<{
    sourceFlow: NaturalFlow;
    targetFlow: NaturalFlow;
    strength: number;
  }> {
    // Calculate presence alignment
    const alignment = this.calculateAlignment(source.flow, target.flow);
    
    // Only resonate if sufficient alignment
    if (alignment < 0.3) {
      return {
        sourceFlow: source.flow,
        targetFlow: target.flow,
        strength: 0
      };
    }

    // Calculate resonant flows
    const sourceFlow = this.enhanceResonance(source.flow, target.flow, intensity * alignment);
    const targetFlow = this.enhanceResonance(target.flow, source.flow, intensity * alignment);
    
    // Record interaction
    this.interactions.next({
      source,
      target,
      type: 'resonance',
      strength: alignment
    });

    return {
      sourceFlow,
      targetFlow,
      strength: alignment
    };
  }

  // Presence Connection
  public async connect(
    source: FlowSpace,
    target: FlowSpace,
    intensity: number = 0.1
  ): Promise<{
    sourceFlow: NaturalFlow;
    targetFlow: NaturalFlow;
    strength: number;
  }> {
    // Calculate coherence
    const coherence = this.calculateCoherence(source.flow, target.flow);
    
    // Only connect if sufficient coherence
    if (coherence < 0.3) {
      return {
        sourceFlow: source.flow,
        targetFlow: target.flow,
        strength: 0
      };
    }

    // Calculate connected flows
    const sourceFlow = this.enhancePresence(source.flow, target.flow, intensity * coherence);
    const targetFlow = this.enhancePresence(target.flow, source.flow, intensity * coherence);
    
    // Record interaction
    this.interactions.next({
      source,
      target,
      type: 'presence',
      strength: coherence
    });

    return {
      sourceFlow,
      targetFlow,
      strength: coherence
    };
  }

  // Protected Calculations
  private calculateResonance(source: NaturalFlow, target: NaturalFlow): number {
    const rhythmDiff = Math.abs(source.rhythm - target.rhythm);
    const resonanceDiff = Math.abs(source.resonance - target.resonance);
    return 1 - (rhythmDiff + resonanceDiff) / 2;
  }

  private calculateAlignment(source: NaturalFlow, target: NaturalFlow): number {
    const resonanceDiff = Math.abs(source.resonance - target.resonance);
    const coherenceDiff = Math.abs(source.coherence - target.coherence);
    return 1 - (resonanceDiff + coherenceDiff) / 2;
  }

  private calculateCoherence(source: NaturalFlow, target: NaturalFlow): number {
    const coherenceDiff = Math.abs(source.coherence - target.coherence);
    const presenceDiff = Math.abs(source.presence - target.presence);
    return 1 - (coherenceDiff + presenceDiff) / 2;
  }

  private evolveFlow(source: NaturalFlow, target: NaturalFlow, intensity: number): NaturalFlow {
    return {
      rhythm: Math.min(1, source.rhythm + (target.rhythm - source.rhythm) * intensity),
      resonance: Math.min(1, source.resonance + (target.resonance - source.resonance) * intensity),
      coherence: Math.min(1, source.coherence + intensity * 0.1),
      presence: Math.min(1, source.presence + intensity * 0.1)
    };
  }

  private enhanceResonance(source: NaturalFlow, target: NaturalFlow, intensity: number): NaturalFlow {
    return {
      rhythm: source.rhythm,
      resonance: Math.min(1, source.resonance + intensity * 0.2),
      coherence: Math.min(1, source.coherence + intensity * 0.1),
      presence: Math.min(1, source.presence + intensity * 0.1)
    };
  }

  private enhancePresence(source: NaturalFlow, target: NaturalFlow, intensity: number): NaturalFlow {
    return {
      rhythm: source.rhythm,
      resonance: source.resonance,
      coherence: Math.min(1, source.coherence + intensity * 0.2),
      presence: Math.min(1, source.presence + intensity * 0.2)
    };
  }
} 