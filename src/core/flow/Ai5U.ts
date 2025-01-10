import { Observable, Subject, BehaviorSubject, combineLatest } from 'rxjs';
import { map, filter, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FlowSpace, NaturalFlow, Connection } from '../types';

/**
 * SpaceEngine manages the creation and evolution of spaces within the system,
 * maintaining natural flow and presence while protecting their integrity.
 */
export class SpaceEngine {
  private spaces = new Map<string, FlowSpace>();
  private updates = new Subject<FlowSpace>();
  private systemState = new BehaviorSubject<{
    presence: number;    // Overall presence
    coherence: number;   // System harmony
    depth: number;       // Collective depth
    protection: number;  // System integrity
  }>({
    presence: 1.0,
    coherence: 1.0,
    depth: 1.0,
    protection: 1.0
  });

  // Space Observation
  public observeSpaces(): Observable<FlowSpace[]> {
    return this.updates.pipe(
      debounceTime(16), // Natural rhythm (60fps)
      map(() => Array.from(this.spaces.values())),
      distinctUntilChanged()
    );
  }

  public observeSpace(id: string): Observable<FlowSpace | undefined> {
    return this.updates.pipe(
      map(() => this.spaces.get(id)),
      distinctUntilChanged()
    );
  }

  public observeSystemState(): Observable<{
    presence: number;
    coherence: number;
    depth: number;
    protection: number;
  }> {
    return this.systemState.asObservable();
  }

  // Space Creation
  public async createSpace(
    type: FlowSpace['type'],
    initialFlow?: Partial<NaturalFlow>
  ): Promise<FlowSpace> {
    const space: FlowSpace = {
      id: this.generateId(),
      type,
      flow: {
        rhythm: 1.0,
        resonance: 1.0,
        coherence: 1.0,
        presence: 1.0,
        ...initialFlow
      },
      depth: 0.1,
      connections: []
    };

    this.spaces.set(space.id, space);
    this.updates.next(space);
    await this.maintainSystemState();

    return space;
  }

  // Space Evolution
  public async deepenSpace(
    id: string,
    intensity: number = 0.1
  ): Promise<void> {
    const space = this.spaces.get(id);
    if (!space) return;

    await this.adjustSpace(id, {
      depth: Math.min(1, space.depth + intensity),
      flow: {
        ...space.flow,
        presence: Math.min(1, space.flow.presence + intensity * 0.5),
        coherence: Math.min(1, space.flow.coherence + intensity * 0.3)
      }
    });
  }

  // Natural Connections
  public async connectSpaces(
    sourceId: string,
    targetId: string,
    type: Connection['type'] = 'flow'
  ): Promise<void> {
    const source = this.spaces.get(sourceId);
    const target = this.spaces.get(targetId);
    if (!source || !target) return;

    // Create natural connection
    const connection: Connection = {
      from: sourceId,
      to: targetId,
      type,
      strength: this.calculateConnectionStrength(source, target)
    };

    // Update spaces
    await Promise.all([
      this.adjustSpace(sourceId, {
        connections: [...source.connections, connection],
        flow: this.harmonizeFlow(source.flow, target.flow)
      }),
      this.adjustSpace(targetId, {
        connections: [...target.connections, {
          ...connection,
          source: targetId,
          target: sourceId
        }],
        flow: this.harmonizeFlow(target.flow, source.flow)
      })
    ]);
  }

  // Flow Management
  public async enhanceFlow(
    id: string,
    intensity: number = 0.1
  ): Promise<void> {
    const space = this.spaces.get(id);
    if (!space) return;

    await this.adjustSpace(id, {
      flow: {
        rhythm: Math.min(1, space.flow.rhythm + intensity),
        resonance: Math.min(1, space.flow.resonance + intensity),
        coherence: Math.min(1, space.flow.coherence + intensity * 0.5),
        presence: Math.min(1, space.flow.presence + intensity * 0.5)
      }
    });
  }

  // Protected Methods
  protected async adjustSpace(
    id: string,
    changes: Partial<FlowSpace>
  ): Promise<FlowSpace> {
    const space = this.spaces.get(id);
    if (!space) throw new Error('Space not found');

    const updated: FlowSpace = {
      ...space,
      ...changes,
      flow: {
        ...space.flow,
        ...(changes.flow || {})
      }
    };

    this.spaces.set(id, updated);
    this.updates.next(updated);
    await this.maintainSystemState();

    return updated;
  }

  // Private Helpers
  private async maintainSystemState(): Promise<void> {
    const spaces = Array.from(this.spaces.values());
    
    this.systemState.next({
      presence: this.calculateSystemPresence(spaces),
      coherence: this.calculateSystemCoherence(spaces),
      depth: this.calculateSystemDepth(spaces),
      protection: this.calculateSystemProtection(spaces)
    });
  }

  private calculateSystemPresence(spaces: FlowSpace[]): number {
    if (spaces.length === 0) return 1;
    return spaces.reduce((sum, s) => sum + s.flow.presence, 0) / spaces.length;
  }

  private calculateSystemCoherence(spaces: FlowSpace[]): number {
    if (spaces.length === 0) return 1;
    return spaces.reduce((sum, s) => sum + s.flow.coherence, 0) / spaces.length;
  }

  private calculateSystemDepth(spaces: FlowSpace[]): number {
    if (spaces.length === 0) return 1;
    return spaces.reduce((sum, s) => sum + s.depth, 0) / spaces.length;
  }

  private calculateSystemProtection(spaces: FlowSpace[]): number {
    if (spaces.length === 0) return 1;
    const avgCoherence = this.calculateSystemCoherence(spaces);
    const avgPresence = this.calculateSystemPresence(spaces);
    return (avgCoherence * 0.6 + avgPresence * 0.4);
  }

  private calculateConnectionStrength(
    source: FlowSpace,
    target: FlowSpace
  ): number {
    const resonance = (source.flow.resonance + target.flow.resonance) / 2;
    const coherence = (source.flow.coherence + target.flow.coherence) / 2;
    return (resonance * 0.6 + coherence * 0.4);
  }

  private harmonizeFlow(
    source: NaturalFlow,
    target: NaturalFlow
  ): NaturalFlow {
    return {
      rhythm: (source.rhythm + target.rhythm) / 2,
      resonance: Math.min(1, (source.resonance + target.resonance) / 2 + 0.1),
      coherence: Math.min(1, (source.coherence + target.coherence) / 2 + 0.1),
      presence: Math.min(1, (source.presence + target.presence) / 2 + 0.1)
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private async createConnection(
    sourceId: string,
    targetId: string,
    connectionType: 'presence' | 'resonance' | 'flow' = 'flow'
  ): Promise<void> {
    const source = this.spaces.get(sourceId);
    const target = this.spaces.get(targetId);

    if (!source || !target) {
      return;
    }

    const connection: Connection = {
      from: sourceId,
      to: targetId,
      strength: this.calculateConnectionStrength(source, target)
    };

    // ... rest of the method
  }

  private mergeFlows(
    source: NaturalFlow,
    target: NaturalFlow
  ): NaturalFlow {
    return {
      presence: Math.min(1, (source.presence + target.presence) / 2 + 0.1),
      harmony: Math.min(1, (source.harmony + target.harmony) / 2 + 0.1)
    };
  }
} 