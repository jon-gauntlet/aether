import { BehaviorSubject, Observable, Subject, merge } from 'rxjs';
import { map, filter, scan, debounceTime } from 'rxjs/operators';
import {
  MindSpace,
  ConsciousnessState,
  Resonance,
  Depth,
  Connection,
  SpaceState
} from '../types/consciousness';

interface SpaceEvent {
  type: 'expansion' | 'contraction' | 'resonance' | 'connection';
  data: any;
  timestamp: number;
}

export class MindSpaceSystem {
  private spaces: Map<string, BehaviorSubject<MindSpace>>;
  private events: Subject<SpaceEvent>;
  private connections: Map<string, Connection[]>;
  
  private readonly EVOLUTION_INTERVAL = 100;
  private readonly RESONANCE_THRESHOLD = 0.7;
  private readonly MAX_CONNECTIONS = 50;
  
  constructor() {
    this.spaces = new Map();
    this.events = new Subject();
    this.connections = new Map();
    this.initializeNaturalProcesses();
  }
  
  private initializeNaturalProcesses() {
    // Natural space evolution
    setInterval(() => this.evolveSpaces(), this.EVOLUTION_INTERVAL);
    
    // Resonance harmonization
    this.events.pipe(
      filter(event => event.type === 'resonance'),
      debounceTime(300)
    ).subscribe(() => this.harmonizeResonance());
    
    // Space connection management
    this.events.pipe(
      filter(event => event.type === 'connection'),
      debounceTime(200)
    ).subscribe(() => this.manageConnections());
  }
  
  // Create a new mind space
  createSpace(id: string, type: 'focus' | 'explore' | 'rest'): MindSpace {
    const space: MindSpace = {
      id,
      type,
      state: this.createInitialState(type),
      connections: [],
      evolution: {
        depth: this.createInitialDepth(type),
        coherence: 1,
        momentum: 1
      }
    };
    
    const spaceSubject = new BehaviorSubject(space);
    this.spaces.set(id, spaceSubject);
    this.connections.set(id, []);
    
    this.emitEvent({
      type: 'expansion',
      data: space,
      timestamp: Date.now()
    });
    
    return space;
  }
  
  // Connect spaces based on resonance
  connectSpaces(sourceId: string, targetId: string) {
    const source = this.spaces.get(sourceId)?.value;
    const target = this.spaces.get(targetId)?.value;
    
    if (!source || !target) return;
    
    const resonance = this.calculateSpaceResonance(source, target);
    
    if (resonance > this.RESONANCE_THRESHOLD) {
      const connection: Connection = {
        id: `${sourceId}_${targetId}`,
        sourceId,
        targetId,
        strength: resonance,
        type: 'space',
        resonance: this.createConnectionResonance(resonance)
      };
      
      this.addConnection(sourceId, connection);
      this.addConnection(targetId, connection);
      
      this.emitEvent({
        type: 'connection',
        data: connection,
        timestamp: Date.now()
      });
    }
  }
  
  private addConnection(spaceId: string, connection: Connection) {
    const connections = this.connections.get(spaceId) || [];
    const updatedConnections = [...connections, connection]
      .slice(-this.MAX_CONNECTIONS);
    
    this.connections.set(spaceId, updatedConnections);
    
    const space = this.spaces.get(spaceId)?.value;
    if (space) {
      this.spaces.get(spaceId)?.next({
        ...space,
        connections: updatedConnections
      });
    }
  }
  
  private evolveSpaces() {
    this.spaces.forEach((spaceSubject, id) => {
      const space = spaceSubject.value;
      
      // Natural space evolution
      const state = this.evolveState(space.state, space.type);
      
      spaceSubject.next({
        ...space,
        state
      });
      
      this.emitEvent({
        type: 'resonance',
        data: { spaceId: id, state },
        timestamp: Date.now()
      });
    });
  }
  
  private evolveState(state: SpaceState, type: MindSpace['type']): SpaceState {
    const resonance = this.evolveResonance(state.resonance, type);
    
    return {
      ...state,
      resonance,
      depth: this.evolveDepth(state.depth, type)
    };
  }
  
  private evolveResonance(resonance: Resonance, type: MindSpace['type']): Resonance {
    let frequency = resonance.frequency;
    let amplitude = resonance.amplitude;
    
    switch (type) {
      case 'focus':
        frequency = Math.max(0.2, frequency - 0.01);
        amplitude = Math.min(0.8, amplitude + 0.01);
        break;
      case 'explore':
        frequency = Math.min(0.8, frequency + 0.01);
        amplitude = Math.max(0.4, amplitude - 0.01);
        break;
      default:
        // Maintain current values for rest state
        break;
    }
    
    return {
      ...resonance,
      frequency,
      amplitude,
      harmony: Math.min(1, resonance.harmony + 0.005),
      field: {
        ...resonance.field,
        strength: Math.min(1, resonance.field.strength + 0.01)
      }
    };
  }
  
  private evolveDepth(depth: Depth, type: MindSpace['type']): Depth {
    let level = depth.level;
    let clarity = depth.clarity;
    let stillness = depth.stillness;
    
    switch (type) {
      case 'focus':
        level = Math.min(1, level + 0.01);
        clarity = Math.min(1, clarity + 0.005);
        stillness = Math.min(1, stillness + 0.01);
        break;
      case 'explore':
        level = Math.max(0.3, level - 0.005);
        clarity = Math.max(0.6, clarity - 0.005);
        stillness = Math.max(0.4, stillness - 0.01);
        break;
      default:
        // Gentle restoration for rest state
        level = level + (0.5 - level) * 0.1;
        clarity = Math.min(1, clarity + 0.01);
        stillness = Math.min(1, stillness + 0.01);
    }
    
    return {
      level,
      clarity,
      stillness,
      presence: Math.min(1, depth.presence + 0.005)
    };
  }
  
  private harmonizeResonance() {
    this.spaces.forEach((spaceSubject, id) => {
      const space = spaceSubject.value;
      const connections = this.connections.get(id) || [];
      
      if (connections.length > 0) {
        // Calculate average resonance from connected spaces
        const connectedResonances = connections.map(conn => {
          const connectedSpace = this.spaces.get(
            conn.sourceId === id ? conn.targetId : conn.sourceId
          )?.value;
          return connectedSpace?.state.resonance;
        }).filter(Boolean) as Resonance[];
        
        if (connectedResonances.length > 0) {
          const harmonizedResonance = this.harmonizeResonances(
            [space.state.resonance, ...connectedResonances]
          );
          
          spaceSubject.next({
            ...space,
            state: {
              ...space.state,
              resonance: harmonizedResonance
            }
          });
        }
      }
    });
  }
  
  private harmonizeResonances(resonances: Resonance[]): Resonance {
    const avgFrequency = resonances.reduce((sum, r) => sum + r.frequency, 0) / resonances.length;
    const avgAmplitude = resonances.reduce((sum, r) => sum + r.amplitude, 0) / resonances.length;
    const avgHarmony = resonances.reduce((sum, r) => sum + r.harmony, 0) / resonances.length;
    const avgStrength = resonances.reduce((sum, r) => sum + r.field.strength, 0) / resonances.length;
    
    return {
      frequency: avgFrequency,
      amplitude: avgAmplitude,
      harmony: Math.min(1, avgHarmony + 0.1),
      field: {
        center: { x: 0, y: 0, z: 0 },
        radius: 1,
        strength: Math.min(1, avgStrength + 0.1),
        harmonics: []
      }
    };
  }
  
  private calculateSpaceResonance(a: MindSpace, b: MindSpace): number {
    const resonanceHarmony = this.calculateResonanceHarmony(
      a.state.resonance,
      b.state.resonance
    );
    
    const depthHarmony = this.calculateDepthHarmony(
      a.state.depth,
      b.state.depth
    );
    
    return (resonanceHarmony + depthHarmony) / 2;
  }
  
  private calculateResonanceHarmony(a: Resonance, b: Resonance): number {
    const frequencyDiff = Math.abs(a.frequency - b.frequency);
    const amplitudeDiff = Math.abs(a.amplitude - b.amplitude);
    return Math.max(0, 1 - (frequencyDiff + amplitudeDiff) / 2);
  }
  
  private calculateDepthHarmony(a: Depth, b: Depth): number {
    const levelDiff = Math.abs(a.level - b.level);
    const clarityDiff = Math.abs(a.clarity - b.clarity);
    const stillnessDiff = Math.abs(a.stillness - b.stillness);
    
    return Math.max(0, 1 - (levelDiff + clarityDiff + stillnessDiff) / 3);
  }
  
  private createInitialState(type: MindSpace['type']): SpaceState {
    return {
      resonance: this.createInitialResonance(type),
      depth: this.createInitialDepth(type)
    };
  }
  
  private createInitialResonance(type: MindSpace['type']): Resonance {
    switch (type) {
      case 'focus':
        return {
          frequency: 0.3,
          amplitude: 0.7,
          harmony: 1,
          field: {
            center: { x: 0, y: 0, z: 0 },
            radius: 1,
            strength: 1,
            harmonics: []
          }
        };
      case 'explore':
        return {
          frequency: 0.7,
          amplitude: 0.5,
          harmony: 1,
          field: {
            center: { x: 0, y: 0, z: 0 },
            radius: 1.5,
            strength: 1,
            harmonics: []
          }
        };
      default:
        return {
          frequency: 0.5,
          amplitude: 0.5,
          harmony: 1,
          field: {
            center: { x: 0, y: 0, z: 0 },
            radius: 1,
            strength: 1,
            harmonics: []
          }
        };
    }
  }
  
  private createInitialDepth(type: MindSpace['type']): Depth {
    switch (type) {
      case 'focus':
        return {
          level: 0.7,
          clarity: 1,
          stillness: 0.8,
          presence: 1
        };
      case 'explore':
        return {
          level: 0.4,
          clarity: 0.8,
          stillness: 0.6,
          presence: 1
        };
      default:
        return {
          level: 0.5,
          clarity: 1,
          stillness: 0.7,
          presence: 1
        };
    }
  }
  
  private createConnectionResonance(strength: number): Resonance {
    return {
      frequency: 0.5,
      amplitude: strength,
      harmony: 1,
      field: {
        center: { x: 0, y: 0, z: 0 },
        radius: strength,
        strength: strength,
        harmonics: []
      }
    };
  }
  
  private emitEvent(event: SpaceEvent) {
    this.events.next(event);
  }
  
  // Public observation methods
  observeSpace(id: string): Observable<MindSpace | undefined> {
    const subject = this.spaces.get(id);
    return subject ? subject.asObservable() :
      new Observable(sub => sub.next(undefined));
  }
  
  observeEvents(): Observable<SpaceEvent> {
    return this.events.asObservable();
  }
  
  observeConnections(spaceId: string): Observable<Connection[]> {
    return this.observeSpace(spaceId).pipe(
      map(space => space?.connections || [])
    );
  }
} 