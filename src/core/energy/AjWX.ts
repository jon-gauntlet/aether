import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FlowSpace, MindSpace, Connection, FlowMetrics, Resonance, Protection, NaturalFlow } from '../types/base';
import { createDefaultField } from '../factories/field';
import { createEmptyNaturalFlow } from '../factories/flow';

export class SpaceEngine {
  private spaceSubject: BehaviorSubject<FlowSpace>;
  private spaces = new Map<string, MindSpace>();

  constructor(id: string = 'root') {
    const initialSpace: FlowSpace = {
      id,
      type: 'natural',
      metrics: {
        depth: 0.8,
        harmony: 0.8,
        energy: 0.8,
        presence: 0.8,
        resonance: 0.8,
        coherence: 0.8,
        rhythm: 0.8
      },
      resonance: {
        frequency: 0.8,
        amplitude: 0.8,
        harmony: 0.8,
        field: createDefaultField(),
        essence: 0.8
      },
      depth: 0.8,
      protection: {
        level: 0.8,
        strength: 0.8,
        resilience: 0.8,
        adaptability: 0.8,
        field: createDefaultField()
      },
      connections: [],
      flow: createEmptyNaturalFlow(),
      timestamp: Date.now()
    };

    this.spaceSubject = new BehaviorSubject<FlowSpace>(initialSpace);
  }

  observe(): Observable<FlowSpace> {
    return this.spaceSubject.asObservable();
  }

  observeMetrics(): Observable<FlowMetrics> {
    return this.spaceSubject.pipe(
      map(space => space.metrics)
    );
  }

  observeResonance(): Observable<Resonance> {
    return this.spaceSubject.pipe(
      map(space => space.resonance)
    );
  }

  observeProtection(): Observable<Protection> {
    return this.spaceSubject.pipe(
      map(space => space.protection)
    );
  }

  observeFlow(): Observable<NaturalFlow> {
    return this.spaceSubject.pipe(
      map(space => space.flow)
    );
  }

  connect(targetId: string, type: string = 'resonance'): void {
    const current = this.spaceSubject.getValue();
    const connection: Connection = {
      id: `${current.id}-${targetId}`,
      type,
      strength: 0.8,
      quality: 0.8,
      sourceId: current.id,
      targetId
    };

    this.updateState({
      connections: [...current.connections, connection]
    });
  }

  private updateState(changes: Partial<FlowSpace>): void {
    const current = this.spaceSubject.getValue();
    this.spaceSubject.next({
      ...current,
      ...changes,
      timestamp: Date.now()
    });
  }

  destroy(): void {
    this.spaceSubject.complete();
  }
}