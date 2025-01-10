import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { map, filter, debounceTime } from 'rxjs/operators';
import { Field, Protection, Resonance } from '../types/consciousness';
import { FlowPattern, FlowType } from '../flow/FlowEngine';

export type SpaceType = 'sanctuary' | 'stream' | 'pool' | 'confluence';
export type SpaceDepth = 'surface' | 'shallow' | 'deep' | 'profound';

export interface SpaceState {
  active: boolean;
  depth: SpaceDepth;
  capacity: number;      // How much it can hold
  occupancy: number;     // Current occupation
  resonance: Resonance;
  protection: Protection;
  timestamp: number;
}

export interface SpacePattern {
  id: string;
  type: SpaceType;
  state: SpaceState;
  field: Field;
  flows: Set<string>;    // Flow IDs present in this space
  connections: Set<string>; // Connected space IDs
}

export class SpaceEngine {
  private spaces = new Map<string, SpacePattern>();
  private updates = new Subject<SpacePattern>();
  private resonance = new BehaviorSubject<Resonance>({
    frequency: 0.5,
    amplitude: 0.5,
    harmony: 0.5,
    field: {
      center: { x: 0, y: 0, z: 0 },
      radius: 1,
      strength: 0.5,
      waves: []
    }
  });

  public observe(): Observable<SpacePattern[]> {
    return this.updates.pipe(
      debounceTime(100), // Natural rhythm
      map(() => this.current())
    );
  }

  public observeResonance(): Observable<Resonance> {
    return this.resonance.asObservable();
  }

  public async create(type: SpaceType): Promise<SpacePattern> {
    const space: SpacePattern = {
      id: this.createId(),
      type,
      state: {
        active: true,
        depth: 'surface',
        capacity: this.calculateCapacity(type),
        occupancy: 0,
        resonance: this.resonance.value,
        protection: {
          strength: 0.3,
          resilience: 0.3,
          adaptability: 0.5
        },
        timestamp: Date.now()
      },
      field: {
        center: { x: 0, y: 0, z: 0 },
        radius: 1,
        strength: 0.5,
        waves: []
      },
      flows: new Set(),
      connections: new Set()
    };

    this.spaces.set(space.id, space);
    this.updates.next(space);
    await this.updateResonance();

    return space;
  }

  public async enter(spaceId: string, flow: FlowPattern): Promise<boolean> {
    const space = this.spaces.get(spaceId);
    if (!space) return false;

    // Check capacity
    if (space.state.occupancy >= space.state.capacity) {
      return false;
    }

    // Natural integration
    space.flows.add(flow.id);
    space.state.occupancy++;
    
    // Adapt space to flow
    await this.adapt(space.id, {
      resonance: this.calculateCombinedResonance([...space.flows].map(id => flow)),
      protection: this.calculateCombinedProtection(space, flow)
    });

    return true;
  }

  public async leave(spaceId: string, flowId: string): Promise<boolean> {
    const space = this.spaces.get(spaceId);
    if (!space || !space.flows.has(flowId)) return false;

    // Natural separation
    space.flows.delete(flowId);
    space.state.occupancy--;
    
    // Readjust space
    await this.adapt(space.id, {
      resonance: this.calculateCombinedResonance([...space.flows].map(id => ({ id } as FlowPattern))),
      protection: this.calculateBaseProtection(space.type, space.state.depth)
    });

    return true;
  }

  public async connect(sourceId: string, targetId: string): Promise<boolean> {
    const source = this.spaces.get(sourceId);
    const target = this.spaces.get(targetId);
    if (!source || !target) return false;

    // Natural connection
    source.connections.add(targetId);
    target.connections.add(sourceId);

    // Update both spaces
    await this.updateResonance();
    this.updates.next(source);
    this.updates.next(target);

    return true;
  }

  public async adapt(id: string, changes: Partial<SpaceState>): Promise<SpacePattern> {
    const space = this.spaces.get(id);
    if (!space) throw new Error('Space not found');

    // Natural adaptation
    const updated: SpacePattern = {
      ...space,
      state: {
        ...space.state,
        ...changes,
        timestamp: Date.now()
      }
    };

    // Protect deep spaces
    if (updated.state.depth === 'deep' || updated.state.depth === 'profound') {
      updated.state.protection.strength = Math.max(updated.state.protection.strength, 0.7);
    }

    this.spaces.set(id, updated);
    this.updates.next(updated);
    await this.updateResonance();

    return updated;
  }

  private calculateCapacity(type: SpaceType): number {
    switch (type) {
      case 'sanctuary': return 1;  // Individual space
      case 'stream': return 10;    // Flow space
      case 'pool': return 5;       // Gathering space
      case 'confluence': return 20; // Meeting space
      default: return 5;
    }
  }

  private calculateBaseProtection(type: SpaceType, depth: SpaceDepth): Protection {
    const baseStrength = {
      sanctuary: 0.7,
      stream: 0.4,
      pool: 0.5,
      confluence: 0.3
    }[type] || 0.5;

    const depthMultiplier = {
      surface: 1,
      shallow: 1.2,
      deep: 1.5,
      profound: 2
    }[depth];

    return {
      strength: baseStrength * depthMultiplier,
      resilience: baseStrength * depthMultiplier,
      adaptability: 0.5
    };
  }

  private calculateCombinedResonance(flows: FlowPattern[]): Resonance {
    if (flows.length === 0) return this.resonance.value;

    return {
      frequency: flows.reduce((acc, f) => acc + f.state.resonance.frequency, 0) / flows.length,
      amplitude: flows.reduce((acc, f) => acc + f.state.resonance.amplitude, 0) / flows.length,
      harmony: this.calculateHarmony(flows),
      field: this.calculateCombinedField(flows)
    };
  }

  private calculateCombinedProtection(space: SpacePattern, flow: FlowPattern): Protection {
    const base = this.calculateBaseProtection(space.type, space.state.depth);
    return {
      strength: (base.strength + flow.state.protection.strength) / 2,
      resilience: (base.resilience + flow.state.protection.resilience) / 2,
      adaptability: (base.adaptability + flow.state.protection.adaptability) / 2
    };
  }

  private calculateHarmony(flows: FlowPattern[]): number {
    if (flows.length <= 1) return 1;
    
    let totalHarmony = 0;
    let connections = 0;
    
    for (let i = 0; i < flows.length; i++) {
      for (let j = i + 1; j < flows.length; j++) {
        const a = flows[i];
        const b = flows[j];
        
        const freqDiff = Math.abs(a.state.resonance.frequency - b.state.resonance.frequency);
        const ampDiff = Math.abs(a.state.resonance.amplitude - b.state.resonance.amplitude);
        const harmony = 1 - (freqDiff + ampDiff) / 2;
        
        totalHarmony += harmony;
        connections++;
      }
    }
    
    return connections > 0 ? totalHarmony / connections : 1;
  }

  private calculateCombinedField(flows: FlowPattern[]): Field {
    const fields = flows.map(f => f.field);
    
    const center = {
      x: fields.reduce((acc, f) => acc + f.center.x * f.strength, 0) / fields.length,
      y: fields.reduce((acc, f) => acc + f.center.y * f.strength, 0) / fields.length,
      z: fields.reduce((acc, f) => acc + f.center.z * f.strength, 0) / fields.length
    };
    
    const radius = Math.max(...fields.map(f => f.radius));
    const strength = fields.reduce((acc, f) => acc + f.strength, 0) / fields.length;
    
    const waves = fields.flatMap(f => f.waves)
      .sort((a, b) => b.amplitude - a.amplitude)
      .slice(0, 5);
    
    return { center, radius, strength, waves };
  }

  private async updateResonance(): Promise<void> {
    const spaces = this.current();
    if (spaces.length === 0) {
      this.resonance.next({
        frequency: 0.5,
        amplitude: 0.5,
        harmony: 0.5,
        field: {
          center: { x: 0, y: 0, z: 0 },
          radius: 1,
          strength: 0.5,
          waves: []
        }
      });
      return;
    }

    const resonance: Resonance = {
      frequency: spaces.reduce((acc, s) => acc + s.state.resonance.frequency, 0) / spaces.length,
      amplitude: spaces.reduce((acc, s) => acc + s.state.resonance.amplitude, 0) / spaces.length,
      harmony: this.calculateSystemHarmony(spaces),
      field: this.calculateSystemField(spaces)
    };

    this.resonance.next(resonance);
  }

  private calculateSystemHarmony(spaces: SpacePattern[]): number {
    if (spaces.length <= 1) return 1;
    
    let totalHarmony = 0;
    let connections = 0;
    
    for (let i = 0; i < spaces.length; i++) {
      for (let j = i + 1; j < spaces.length; j++) {
        const a = spaces[i];
        const b = spaces[j];
        
        // Consider both resonance and connection strength
        const freqDiff = Math.abs(a.state.resonance.frequency - b.state.resonance.frequency);
        const ampDiff = Math.abs(a.state.resonance.amplitude - b.state.resonance.amplitude);
        const connected = a.connections.has(b.id) ? 1 : 0.5;
        
        const harmony = (1 - (freqDiff + ampDiff) / 2) * connected;
        
        totalHarmony += harmony;
        connections++;
      }
    }
    
    return connections > 0 ? totalHarmony / connections : 1;
  }

  private calculateSystemField(spaces: SpacePattern[]): Field {
    const fields = spaces.map(s => s.field);
    
    const center = {
      x: fields.reduce((acc, f) => acc + f.center.x * f.strength, 0) / fields.length,
      y: fields.reduce((acc, f) => acc + f.center.y * f.strength, 0) / fields.length,
      z: fields.reduce((acc, f) => acc + f.center.z * f.strength, 0) / fields.length
    };
    
    const radius = Math.max(...fields.map(f => f.radius));
    const strength = fields.reduce((acc, f) => acc + f.strength, 0) / fields.length;
    
    const waves = fields.flatMap(f => f.waves)
      .sort((a, b) => b.amplitude - a.amplitude)
      .slice(0, 5);
    
    return { center, radius, strength, waves };
  }

  private createId(): string {
    return `space_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }

  private current(): SpacePattern[] {
    return Array.from(this.spaces.values());
  }
} 