import { BehaviorSubject, Observable } from 'rxjs';
import { MindSpace, Resonance, Connection, NaturalFlow, Protection, Field } from '../types/base';
import { createDefaultField } from '../factories/field';
import { createEmptyNaturalFlow } from '../factories/flow';

export interface Pool {
  id: string;
  depth: number;
}

export interface Stream {
  id: string;
  activity: number;
}

export interface QuietSpace {
  id: string;
  wisdom: any;
}

export class MindSpaceImpl implements MindSpace {
  private state: BehaviorSubject<MindSpace>;
  private pools: Pool[] = [];
  private streams: Stream[] = [];
  private quietSpaces: QuietSpace[] = [];

  id: string;
  type: 'meditation' | 'focus' | 'flow';
  metrics = {
    depth: 0,
    harmony: 0,
    energy: 0,
    presence: 0,
    resonance: 0,
    coherence: 0,
    rhythm: 0
  };
  resonance: Resonance;
  depth: number;
  protection: Protection;
  connections: Connection[];
  flow: NaturalFlow;
  timestamp: number;

  constructor(id: string, type: 'meditation' | 'focus' | 'flow' = 'meditation') {
    this.id = id;
    this.type = type;
    this.depth = 0;
    this.resonance = {
      frequency: 0,
      amplitude: 0,
      harmony: 0,
      field: createDefaultField(),
      essence: 0
    };
    this.protection = {
      level: 0,
      strength: 0,
      resilience: 0,
      adaptability: 0,
      field: createDefaultField()
    };
    this.connections = [];
    this.flow = createEmptyNaturalFlow();
    this.timestamp = Date.now();

    this.state = new BehaviorSubject<MindSpace>(this);
  }

  async sustain(presence: { type: string, intensity: number }, duration: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, duration));
    const pool: Pool = {
      id: `pool-${Date.now()}`,
      depth: presence.intensity
    };
    this.pools.push(pool);
    this.updateState();
  }

  focus(interest: { topic: string, intensity: number }): void {
    const stream: Stream = {
      id: `stream-${Date.now()}`,
      activity: interest.intensity
    };
    this.streams.push(stream);
    this.updateState();
  }

  async preserve(wisdom: any): Promise<void> {
    const space: QuietSpace = {
      id: `space-${Date.now()}`,
      wisdom
    };
    this.quietSpaces.push(space);
    this.updateState();
  }

  createSpace(id: string): MindSpace {
    return new MindSpaceImpl(id);
  }

  connect(targetId: string, type: string = 'resonance', strength: number = 0.5): void {
    const connection: Connection = {
      id: `${this.id}-${targetId}`,
      type,
      strength,
      quality: 0.5,
      from: this.id,
      to: targetId
    };

    this.connections.push(connection);
    this.updateState();
  }

  getConnection(sourceId: string, targetId: string): Connection | undefined {
    return this.connections.find(c => 
      (c.from === sourceId && c.to === targetId) ||
      (c.sourceId === sourceId && c.targetId === targetId)
    );
  }

  getPools(): Pool[] {
    return this.pools;
  }

  getStreams(): Stream[] {
    return this.streams;
  }

  getQuietSpaces(): QuietSpace[] {
    return this.quietSpaces;
  }

  private updateState(): void {
    this.timestamp = Date.now();
    this.state.next(this);
  }

  observe(): Observable<MindSpace> {
    return this.state.asObservable();
  }
}