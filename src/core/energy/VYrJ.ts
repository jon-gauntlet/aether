import { BehaviorSubject, Observable, merge } from 'rxjs';
import { map, filter, scan } from 'rxjs/operators';
import {
  State,
  Space,
  Stream,
  Resonance,
  Field,
  Depth,
  Protection,
  SystemMeta,
  Frequency,
  Amplitude,
  Coherence,
  Presence,
  Connection,
  Wave,
  Insight,
  Engagement,
  Flow,
  SpaceType
} from '../types';

export class Engine {
  private state: BehaviorSubject<State>;
  private spaces: Map<string, BehaviorSubject<Space>>;
  private streams: Map<string, BehaviorSubject<Stream>>;
  private meta: SystemMeta;

  constructor(meta: SystemMeta) {
    this.meta = meta;
    this.spaces = new Map();
    this.streams = new Map();
    this.state = new BehaviorSubject<State>(this.createInitialState());
    this.initializeProcesses();
  }

  private initializeProcesses() {
    // Core system processes
    setInterval(() => this.maintainBalance(), 100);
    setInterval(() => this.updateConnections(), 150);
    setInterval(() => this.processChanges(), 200);
    setInterval(() => this.integrateState(), 300);
  }

  // Public API
  createSpace(type: SpaceType): string {
    const id = `space_${Date.now()}`;
    const space = {
      id,
      type,
      state: this.createInitialState(),
      participants: [],
      field: this.createField(),
      boundaries: []
    };

    this.spaces.set(id, new BehaviorSubject(space));
    return id;
  }

  addStream(content: any, spaceId?: string): string {
    const id = `stream_${Date.now()}`;
    const stream = {
      id,
      content,
      resonance: this.createResonance(),
      depth: this.createDepth(),
      coherence: 1,
      history: [],
      connections: []
    };

    this.streams.set(id, new BehaviorSubject(stream));
    if (spaceId) {
      this.connect(id, spaceId);
    }
    return id;
  }

  // Observation methods
  observe(): Observable<State> {
    return this.state.asObservable();
  }

  observeSpace(id: string): Observable<Space | undefined> {
    const subject = this.spaces.get(id);
    return subject ? subject.asObservable() : 
      new Observable(sub => sub.next(undefined));
  }

  observeStream(id: string): Observable<Stream | undefined> {
    const subject = this.streams.get(id);
    return subject ? subject.asObservable() :
      new Observable(sub => sub.next(undefined));
  }

  // Private implementation
  private createInitialState(): State {
    return {
      id: 'root',
      resonance: this.createResonance(),
      depth: this.createDepth(),
      energy: 1,
      coherence: 1,
      presence: 1,
      insight: this.createInsight(),
      engagement: this.createEngagement(),
      flow: this.createFlow()
    };
  }

  private createResonance(): Resonance {
    return {
      frequency: this.meta.baseFrequency,
      amplitude: this.meta.baseAmplitude,
      harmony: 1,
      field: this.createField()
    };
  }

  private createField(): Field {
    return {
      center: { x: 0, y: 0, z: 0 },
      radius: 1,
      strength: 1,
      waves: []
    };
  }

  private createDepth(): Depth {
    return {
      level: 0,
      clarity: 1,
      stillness: 1,
      presence: 1
    };
  }

  private createInsight(): Insight {
    return {
      clarity: 1,
      purpose: 1,
      understanding: 1,
      stability: 1
    };
  }

  private createEngagement(): Engagement {
    return {
      openness: 1,
      connection: 1,
      understanding: 1,
      growth: 1
    };
  }

  private createFlow(): Flow {
    return {
      pace: 1,
      adaptability: 1,
      emergence: 1,
      balance: 1
    };
  }

  // Core processes
  private maintainBalance() {
    const currentState = this.state.value;
    const spaces = Array.from(this.spaces.values()).map(s => s.value);
    
    const insight = spaces.reduce(
      (acc, space) => this.refineInsight(acc, space),
      this.createInsight()
    );

    this.state.next({
      ...currentState,
      insight
    });
  }

  private updateConnections() {
    const currentState = this.state.value;
    const streams = Array.from(this.streams.values()).map(t => t.value);
    
    const engagement = streams.reduce(
      (acc, stream) => this.refineEngagement(acc, stream),
      this.createEngagement()
    );

    this.state.next({
      ...currentState,
      engagement
    });
  }

  private processChanges() {
    const currentState = this.state.value;
    const spaces = Array.from(this.spaces.values()).map(s => s.value);
    const streams = Array.from(this.streams.values()).map(t => t.value);
    
    const flow = this.calculateFlow(
      currentState.flow,
      spaces,
      streams
    );

    this.state.next({
      ...currentState,
      flow
    });
  }

  private integrateState() {
    const currentState = this.state.value;
    const integrated = this.integrate(
      currentState.insight,
      currentState.engagement,
      currentState.flow
    );

    this.state.next({
      ...currentState,
      ...integrated
    });
  }

  // Helper methods
  private connect(streamId: string, spaceId: string) {
    const stream = this.streams.get(streamId)?.value;
    const space = this.spaces.get(spaceId)?.value;

    if (stream && space) {
      const connection: Connection = {
        id: `conn_${streamId}_${spaceId}`,
        sourceId: streamId,
        targetId: spaceId,
        strength: 1,
        type: 'resonance',
        resonance: this.createResonance()
      };

      this.streams.get(streamId)?.next({
        ...stream,
        connections: [...stream.connections, connection]
      });

      this.spaces.get(spaceId)?.next({
        ...space,
        state: {
          ...space.state,
          resonance: this.harmonize(space.state.resonance, stream.resonance)
        }
      });
    }
  }

  private harmonize(a: Resonance, b: Resonance): Resonance {
    return {
      frequency: (a.frequency + b.frequency) / 2,
      amplitude: Math.max(a.amplitude, b.amplitude),
      harmony: Math.min(1, (a.harmony + b.harmony) / 2 + 0.1),
      field: this.blendFields(a.field, b.field)
    };
  }

  private blendFields(a: Field, b: Field): Field {
    return {
      center: { x: 0, y: 0, z: 0 },
      radius: Math.max(a.radius, b.radius),
      strength: (a.strength + b.strength) / 2,
      waves: [...a.waves, ...b.waves].slice(0, 5)
    };
  }

  private refineAttribute(current: number, influence: number): number {
    const delta = (influence - current) * 0.1;
    return Math.max(0, Math.min(1, current + delta));
  }
} 