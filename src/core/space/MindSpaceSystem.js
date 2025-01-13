import { BehaviorSubject, Observable } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import {
  FlowSpace,
  NaturalFlow,
  Connection,
  isFlowing
} from '../types/consciousness';

export class MindSpaceSystem {
  private spaces: Map<string, BehaviorSubject<FlowSpace>>;

  constructor() {
    this.spaces = new Map();
    this.initializeProtection();
  }

  private initializeProtection(): void {
    setInterval(() => this.maintainSpaces(), 100);
  }

  // Space Protection
  private maintainSpaces(): void {
    this.spaces.forEach((space$) => {
      const space = space$.value;
      if (!isFlowing(space)) {
        space$.next({
          ...space,
          flow: {
            ...space.flow,
            rhythm: Math.min(space.flow.rhythm + 0.1, 1),
            resonance: Math.min(space.flow.resonance + 0.1, 1)
          }
        });
      }
    });
  }

  // Space Operations
  createSpace(type: FlowSpace['type']): string {
    const id = crypto.randomUUID();
    const space: FlowSpace = {
      id,
      type,
      flow: {
        rhythm: 1,
        resonance: 1,
        coherence: 1,
        presence: 1
      },
      depth: 1,
      connections: []
    };

    this.spaces.set(id, new BehaviorSubject(space));
    return id;
  }

  connectSpaces(sourceId: string, targetId: string): void {
    const connection: Connection = {
      source: sourceId,
      target: targetId,
      strength: 1,
      type: 'resonance'
    };

    const sourceSpace = this.spaces.get(sourceId)?.value;
    const targetSpace = this.spaces.get(targetId)?.value;

    if (sourceSpace && targetSpace) {
      this.spaces.get(sourceId)?.next({
        ...sourceSpace,
        connections: [...sourceSpace.connections, connection]
      });

      this.spaces.get(targetId)?.next({
        ...targetSpace,
        connections: [...targetSpace.connections, connection]
      });
    }
  }

  deepenSpace(id: string): void {
    const space = this.spaces.get(id)?.value;
    if (space) {
      this.spaces.get(id)?.next({
        ...space,
        depth: Math.min(space.depth + 0.1, 1)
      });
    }
  }

  // Flow Operations
  increaseFlow(id: string): void {
    const space = this.spaces.get(id)?.value;
    if (space) {
      this.spaces.get(id)?.next({
        ...space,
        flow: {
          ...space.flow,
          rhythm: Math.min(space.flow.rhythm + 0.1, 1),
          resonance: Math.min(space.flow.resonance + 0.1, 1)
        }
      });
    }
  }

  deepenFlow(id: string): void {
    const space = this.spaces.get(id)?.value;
    if (space) {
      this.spaces.get(id)?.next({
        ...space,
        flow: {
          ...space.flow,
          coherence: Math.min(space.flow.coherence + 0.1, 1),
          presence: Math.min(space.flow.presence + 0.1, 1)
        }
      });
    }
  }

  // Observation
  observeSpace(id: string): Observable<FlowSpace | undefined> {
    return this.spaces.get(id)?.pipe(
      distinctUntilChanged()
    ) || new Observable<FlowSpace>();
  }

  observeAllSpaces(): Observable<FlowSpace[]> {
    return new Observable<FlowSpace[]>(observer => {
      const emitSpaces = () => {
        const spaces = Array.from(this.spaces.values()).map(s => s.value);
        observer.next(spaces);
      };

      // Initial emission
      emitSpaces();

      // Subscribe to all space changes
      const subscriptions = Array.from(this.spaces.values()).map(space$ =>
        space$.subscribe(() => emitSpaces())
      );

      // Cleanup
      return () => {
        subscriptions.forEach(sub => sub.unsubscribe());
      };
    }).pipe(distinctUntilChanged());
  }

  // Pure Functions
  static calculateSpaceResonance(a: FlowSpace, b: FlowSpace): number {
    const flowResonance = (
      Math.min(a.flow.resonance, b.flow.resonance) /
      Math.max(a.flow.resonance, b.flow.resonance)
    );

    const depthResonance = (
      Math.min(a.depth, b.depth) /
      Math.max(a.depth, b.depth)
    );

    return (flowResonance * 0.7 + depthResonance * 0.3);
  }

  static calculateSpaceCoherence(space: FlowSpace): number {
    return (
      space.flow.coherence * 0.4 +
      space.flow.presence * 0.3 +
      space.depth * 0.3
    );
  }
} 