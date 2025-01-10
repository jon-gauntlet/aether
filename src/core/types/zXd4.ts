import { BehaviorSubject, Observable, Subject, merge } from 'rxjs';
import { map, filter, scan, debounceTime } from 'rxjs/operators';
import {
  ThoughtStream,
  ThoughtEvolution,
  ConsciousnessState,
  MindSpace,
  Resonance,
  Depth,
  Connection
} from '../types/consciousness';

interface StreamState {
  id: string;
  type: 'focus' | 'explore' | 'connect' | 'rest';
  thoughts: ThoughtStream[];
  evolution: ThoughtEvolution;
  connections: Connection[];
  resonance: Resonance;
  depth: Depth;
}

interface StreamEvent {
  type: 'thought' | 'connection' | 'evolution' | 'resonance';
  data: any;
  timestamp: number;
}

export class ThoughtStreamSystem {
  private streams: Map<string, BehaviorSubject<StreamState>>;
  private events: Subject<StreamEvent>;
  private spaces: Map<string, MindSpace>;
  
  private readonly EVOLUTION_INTERVAL = 100;
  private readonly CONNECTION_THRESHOLD = 0.7;
  private readonly MAX_CONNECTIONS = 50;
  
  constructor() {
    this.streams = new Map();
    this.events = new Subject();
    this.spaces = new Map();
    this.initializeNaturalProcesses();
  }
  
  private initializeNaturalProcesses() {
    // Natural thought evolution
    setInterval(() => this.evolveThoughts(), this.EVOLUTION_INTERVAL);
    
    // Connection formation
    this.events.pipe(
      filter(event => event.type === 'thought'),
      debounceTime(200)
    ).subscribe(() => this.formConnections());
    
    // Resonance harmonization
    this.events.pipe(
      filter(event => event.type === 'resonance'),
      debounceTime(300)
    ).subscribe(() => this.harmonizeResonance());
  }
  
  // Create a new thought stream
  createStream(id: string, type: StreamState['type'], space: MindSpace) {
    const state: StreamState = {
      id,
      type,
      thoughts: [],
      evolution: this.createInitialEvolution(type),
      connections: [],
      resonance: this.createInitialResonance(type),
      depth: this.createInitialDepth(type)
    };
    
    const streamSubject = new BehaviorSubject(state);
    this.streams.set(id, streamSubject);
    this.spaces.set(id, space);
    
    this.emitEvent({
      type: 'thought',
      data: state,
      timestamp: Date.now()
    });
  }
  
  // Add a thought to the stream
  addThought(streamId: string, thought: ThoughtStream) {
    const state = this.streams.get(streamId)?.value;
    if (!state) return;
    
    const thoughts = [...state.thoughts, thought];
    
    this.streams.get(streamId)?.next({
      ...state,
      thoughts,
      evolution: this.evolveWithNewThought(state.evolution, thought)
    });
    
    this.emitEvent({
      type: 'thought',
      data: thought,
      timestamp: Date.now()
    });
  }
  
  // Connect thoughts within and across streams
  private formConnections() {
    this.streams.forEach((streamSubject, streamId) => {
      const state = streamSubject.value;
      
      // Find potential connections within stream
      const newConnections = this.findPotentialConnections(state);
      
      // Find connections with other streams
      this.streams.forEach((otherSubject, otherId) => {
        if (streamId !== otherId) {
          const otherState = otherSubject.value;
          const crossConnections = this.findCrossStreamConnections(
            state,
            otherState
          );
          newConnections.push(...crossConnections);
        }
      });
      
      // Update connections while maintaining limit
      const connections = [
        ...state.connections,
        ...newConnections
      ].slice(-this.MAX_CONNECTIONS);
      
      if (connections.length !== state.connections.length) {
        streamSubject.next({
          ...state,
          connections
        });
        
        this.emitEvent({
          type: 'connection',
          data: { streamId, connections },
          timestamp: Date.now()
        });
      }
    });
  }
  
  private findPotentialConnections(state: StreamState): Connection[] {
    const connections: Connection[] = [];
    const thoughts = state.thoughts;
    
    for (let i = 0; i < thoughts.length; i++) {
      for (let j = i + 1; j < thoughts.length; j++) {
        const resonance = this.calculateThoughtResonance(
          thoughts[i],
          thoughts[j]
        );
        
        if (resonance > this.CONNECTION_THRESHOLD) {
          connections.push({
            id: `${thoughts[i].id}_${thoughts[j].id}`,
            sourceId: thoughts[i].id,
            targetId: thoughts[j].id,
            strength: resonance,
            type: 'internal',
            resonance: this.createConnectionResonance(resonance)
          });
        }
      }
    }
    
    return connections;
  }
  
  private findCrossStreamConnections(
    stateA: StreamState,
    stateB: StreamState
  ): Connection[] {
    const connections: Connection[] = [];
    
    stateA.thoughts.forEach(thoughtA => {
      stateB.thoughts.forEach(thoughtB => {
        const resonance = this.calculateThoughtResonance(thoughtA, thoughtB);
        
        if (resonance > this.CONNECTION_THRESHOLD) {
          connections.push({
            id: `${thoughtA.id}_${thoughtB.id}`,
            sourceId: thoughtA.id,
            targetId: thoughtB.id,
            strength: resonance,
            type: 'external',
            resonance: this.createConnectionResonance(resonance)
          });
        }
      });
    });
    
    return connections;
  }
  
  private calculateThoughtResonance(a: ThoughtStream, b: ThoughtStream): number {
    // Calculate semantic similarity
    const semanticSimilarity = this.calculateSemanticSimilarity(a, b);
    
    // Calculate temporal proximity
    const temporalProximity = this.calculateTemporalProximity(a, b);
    
    // Calculate resonance harmony
    const resonanceHarmony = this.calculateResonanceHarmony(
      a.resonance,
      b.resonance
    );
    
    // Weighted combination
    return (
      semanticSimilarity * 0.5 +
      temporalProximity * 0.3 +
      resonanceHarmony * 0.2
    );
  }
  
  private calculateSemanticSimilarity(
    a: ThoughtStream,
    b: ThoughtStream
  ): number {
    // Placeholder for semantic similarity calculation
    // In practice, this would use embeddings or other NLP techniques
    return Math.random(); // Temporary random value
  }
  
  private calculateTemporalProximity(
    a: ThoughtStream,
    b: ThoughtStream
  ): number {
    const timeDiff = Math.abs(a.timestamp - b.timestamp);
    const maxDiff = 1000 * 60 * 5; // 5 minutes
    return Math.max(0, 1 - timeDiff / maxDiff);
  }
  
  private calculateResonanceHarmony(a: Resonance, b: Resonance): number {
    const frequencyDiff = Math.abs(a.frequency - b.frequency);
    const amplitudeDiff = Math.abs(a.amplitude - b.amplitude);
    return Math.max(0, 1 - (frequencyDiff + amplitudeDiff) / 2);
  }
  
  private evolveThoughts() {
    this.streams.forEach((streamSubject, id) => {
      const state = streamSubject.value;
      
      // Natural thought evolution
      const evolution = {
        ...state.evolution,
        depth: Math.min(1, state.evolution.depth + 0.01),
        coherence: Math.min(1, state.evolution.coherence + 0.005)
      };
      
      // Evolve thoughts based on type
      if (state.type === 'focus') {
        evolution.depth = Math.min(1, evolution.depth + 0.02);
      } else if (state.type === 'explore') {
        evolution.breadth = Math.min(1, evolution.breadth + 0.02);
      }
      
      streamSubject.next({
        ...state,
        evolution
      });
      
      this.emitEvent({
        type: 'evolution',
        data: { streamId: id, evolution },
        timestamp: Date.now()
      });
    });
  }
  
  private harmonizeResonance() {
    this.streams.forEach((streamSubject, id) => {
      const state = streamSubject.value;
      const space = this.spaces.get(id);
      
      if (space) {
        // Harmonize stream resonance with space
        const resonance = this.harmonizeStreamWithSpace(
          state.resonance,
          space.state.resonance
        );
        
        streamSubject.next({
          ...state,
          resonance
        });
        
        this.emitEvent({
          type: 'resonance',
          data: { streamId: id, resonance },
          timestamp: Date.now()
        });
      }
    });
  }
  
  private createInitialEvolution(type: StreamState['type']): ThoughtEvolution {
    switch (type) {
      case 'focus':
        return {
          depth: 0.7,
          breadth: 0.3,
          coherence: 1,
          momentum: 1
        };
      case 'explore':
        return {
          depth: 0.3,
          breadth: 0.8,
          coherence: 1,
          momentum: 1
        };
      default:
        return {
          depth: 0.5,
          breadth: 0.5,
          coherence: 1,
          momentum: 1
        };
    }
  }
  
  private createInitialResonance(type: StreamState['type']): Resonance {
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
  
  private createInitialDepth(type: StreamState['type']): Depth {
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
  
  private evolveWithNewThought(
    evolution: ThoughtEvolution,
    thought: ThoughtStream
  ): ThoughtEvolution {
    return {
      ...evolution,
      depth: Math.min(1, evolution.depth + 0.1),
      coherence: Math.min(1, evolution.coherence + 0.05),
      momentum: Math.min(1, evolution.momentum + 0.1)
    };
  }
  
  private harmonizeStreamWithSpace(
    streamResonance: Resonance,
    spaceResonance: Resonance
  ): Resonance {
    return {
      frequency: (streamResonance.frequency + spaceResonance.frequency) / 2,
      amplitude: Math.max(streamResonance.amplitude, spaceResonance.amplitude),
      harmony: Math.min(1, (streamResonance.harmony + spaceResonance.harmony) / 2 + 0.1),
      field: {
        ...streamResonance.field,
        strength: Math.min(
          1,
          (streamResonance.field.strength + spaceResonance.field.strength) / 2 + 0.1
        )
      }
    };
  }
  
  private emitEvent(event: StreamEvent) {
    this.events.next(event);
  }
  
  // Public observation methods
  observeStream(id: string): Observable<StreamState | undefined> {
    const subject = this.streams.get(id);
    return subject ? subject.asObservable() :
      new Observable(sub => sub.next(undefined));
  }
  
  observeEvents(): Observable<StreamEvent> {
    return this.events.asObservable();
  }
  
  observeConnections(streamId: string): Observable<Connection[]> {
    return this.observeStream(streamId).pipe(
      map(state => state?.connections || [])
    );
  }
} 