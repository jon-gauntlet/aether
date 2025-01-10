import { BehaviorSubject, Observable, merge } from 'rxjs';
import { map, filter, scan } from 'rxjs/operators';
import {
  ConsciousnessState,
  MindSpace,
  ThoughtStream,
  Resonance,
  ResonanceField,
  Depth,
  Protection,
  ConsciousnessMeta,
  Frequency,
  Amplitude,
  Coherence,
  Presence,
  Connection,
  Harmonic
} from '../types/consciousness';

export class ConsciousnessEngine {
  private state: BehaviorSubject<ConsciousnessState>;
  private spaces: Map<string, BehaviorSubject<MindSpace>>;
  private thoughts: Map<string, BehaviorSubject<ThoughtStream>>;
  private meta: ConsciousnessMeta;

  constructor(meta: ConsciousnessMeta) {
    this.meta = meta;
    this.spaces = new Map();
    this.thoughts = new Map();
    
    // Initialize base consciousness state
    this.state = new BehaviorSubject<ConsciousnessState>({
      id: 'root',
      resonance: this.createBaseResonance(),
      depth: this.createBaseDepth(),
      energy: 1,
      coherence: 1,
      presence: 1
    });

    this.initializeNaturalProcesses();
  }

  private initializeNaturalProcesses() {
    // Natural consciousness evolution
    setInterval(() => this.evolveConsciousness(), 100);
    
    // Resonance harmonization
    setInterval(() => this.harmonizeResonance(), 150);
    
    // Depth preservation
    setInterval(() => this.preserveDepth(), 200);
    
    // Pattern emergence
    setInterval(() => this.emergePatterns(), 300);
  }

  private createBaseResonance(): Resonance {
    return {
      frequency: this.meta.baseFrequency,
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

  private createBaseDepth(): Depth {
    return {
      level: 0,
      clarity: 1,
      stillness: 1,
      presence: 1
    };
  }

  // Create a new mind space
  createSpace(type: MindSpace['type']): string {
    const id = `space_${Date.now()}`;
    const space: MindSpace = {
      id,
      type,
      state: {
        id: `state_${id}`,
        resonance: this.createBaseResonance(),
        depth: this.createBaseDepth(),
        energy: 1,
        coherence: 1,
        presence: 1
      },
      inhabitants: [],
      field: {
        center: { x: 0, y: 0, z: 0 },
        radius: 1,
        strength: 1,
        harmonics: []
      },
      boundaries: []
    };

    const spaceSubject = new BehaviorSubject(space);
    this.spaces.set(id, spaceSubject);
    return id;
  }

  // Introduce a new thought into consciousness
  introduceThought(essence: any, initialSpace?: string): string {
    const id = `thought_${Date.now()}`;
    const thought: ThoughtStream = {
      id,
      essence,
      resonance: this.createBaseResonance(),
      depth: this.createBaseDepth(),
      coherence: 1,
      evolution: [],
      connections: []
    };

    const thoughtSubject = new BehaviorSubject(thought);
    this.thoughts.set(id, thoughtSubject);

    if (initialSpace) {
      this.connectThoughtToSpace(id, initialSpace);
    }

    return id;
  }

  private connectThoughtToSpace(thoughtId: string, spaceId: string) {
    const thought = this.thoughts.get(thoughtId)?.value;
    const space = this.spaces.get(spaceId)?.value;

    if (thought && space) {
      // Create resonant connection
      const connection: Connection = {
        source: thoughtId,
        target: spaceId,
        strength: 1,
        resonance: this.harmonizeResonances(thought.resonance, space.state.resonance),
        type: 'resonance'
      };

      // Update thought
      this.thoughts.get(thoughtId)?.next({
        ...thought,
        connections: [...thought.connections, connection]
      });

      // Update space
      this.spaces.get(spaceId)?.next({
        ...space,
        field: this.evolveField(space.field, thought.resonance)
      });
    }
  }

  private evolveConsciousness() {
    const currentState = this.state.value;
    
    // Calculate overall system resonance
    const systemResonance = this.calculateSystemResonance();
    
    // Evolve consciousness state
    this.state.next({
      ...currentState,
      resonance: systemResonance,
      coherence: this.calculateSystemCoherence(systemResonance),
      presence: this.calculateSystemPresence()
    });
  }

  private harmonizeResonance() {
    // Harmonize all active resonance fields
    this.spaces.forEach((spaceSubject, id) => {
      const space = spaceSubject.value;
      const connectedThoughts = this.getConnectedThoughts(id);
      
      if (connectedThoughts.length > 0) {
        const harmonizedField = connectedThoughts.reduce(
          (field, thought) => this.evolveField(field, thought.resonance),
          space.field
        );

        spaceSubject.next({
          ...space,
          field: harmonizedField
        });
      }
    });
  }

  private preserveDepth() {
    // Maintain depth in quiet spaces
    this.spaces.forEach((spaceSubject) => {
      const space = spaceSubject.value;
      
      if (space.type === 'presence' || space.type === 'integration') {
        const newDepth = this.deepenQuietSpace(space.state.depth);
        
        spaceSubject.next({
          ...space,
          state: {
            ...space.state,
            depth: newDepth
          }
        });
      }
    });
  }

  private emergePatterns() {
    // Let patterns naturally emerge from resonance
    const allThoughts = Array.from(this.thoughts.values()).map(s => s.value);
    const resonantGroups = this.findResonantGroups(allThoughts);
    
    resonantGroups.forEach(group => {
      if (group.length >= 3) {
        this.createEmergentSpace(group);
      }
    });
  }

  private calculateSystemResonance(): Resonance {
    const allSpaces = Array.from(this.spaces.values()).map(s => s.value);
    
    return allSpaces.reduce(
      (acc, space) => this.harmonizeResonances(acc, space.state.resonance),
      this.createBaseResonance()
    );
  }

  private calculateSystemCoherence(resonance: Resonance): Coherence {
    return Math.min(
      1,
      (resonance.harmony + resonance.field.strength) / 2
    );
  }

  private calculateSystemPresence(): Presence {
    const allSpaces = Array.from(this.spaces.values()).map(s => s.value);
    const presenceSum = allSpaces.reduce((sum, space) => 
      sum + space.state.presence, 0
    );
    
    return Math.min(1, presenceSum / allSpaces.length);
  }

  private harmonizeResonances(a: Resonance, b: Resonance): Resonance {
    return {
      frequency: (a.frequency + b.frequency) / 2,
      amplitude: Math.max(a.amplitude, b.amplitude),
      harmony: Math.min(1, (a.harmony + b.harmony) / 2 + 0.1),
      field: this.evolveField(a.field, b)
    };
  }

  private evolveField(field: ResonanceField, resonance: Resonance): ResonanceField {
    // Create new harmonic from incoming resonance
    const newHarmonic: Harmonic = {
      frequency: resonance.frequency,
      phase: Math.random() * Math.PI * 2,
      amplitude: resonance.amplitude
    };

    // Combine harmonics
    const harmonics = [...field.harmonics, newHarmonic]
      .filter(h => h.amplitude > 0.1) // Remove weak harmonics
      .slice(0, 5);                   // Keep only strongest harmonics

    return {
      ...field,
      strength: Math.min(1, field.strength + resonance.harmony * 0.1),
      harmonics
    };
  }

  private deepenQuietSpace(depth: Depth): Depth {
    return {
      level: Math.min(1, depth.level + 0.01),
      clarity: Math.min(1, depth.clarity + 0.005),
      stillness: Math.min(1, depth.stillness + 0.01),
      presence: Math.min(1, depth.presence + 0.01)
    };
  }

  private getConnectedThoughts(spaceId: string): ThoughtStream[] {
    return Array.from(this.thoughts.values())
      .map(s => s.value)
      .filter(thought => 
        thought.connections.some(conn => 
          conn.target === spaceId && conn.strength > 0.5
        )
      );
  }

  private findResonantGroups(thoughts: ThoughtStream[]): ThoughtStream[][] {
    const groups: ThoughtStream[][] = [];
    const visited = new Set<string>();

    thoughts.forEach(thought => {
      if (!visited.has(thought.id)) {
        const group = this.findResonantGroup(thought, thoughts, visited);
        if (group.length > 0) {
          groups.push(group);
        }
      }
    });

    return groups;
  }

  private findResonantGroup(
    thought: ThoughtStream,
    allThoughts: ThoughtStream[],
    visited: Set<string>
  ): ThoughtStream[] {
    const group: ThoughtStream[] = [];
    const queue: ThoughtStream[] = [thought];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (!visited.has(current.id)) {
        visited.add(current.id);
        group.push(current);

        // Find resonant neighbors
        const neighbors = allThoughts.filter(t =>
          !visited.has(t.id) &&
          this.areResonant(current, t)
        );

        queue.push(...neighbors);
      }
    }

    return group;
  }

  private areResonant(a: ThoughtStream, b: ThoughtStream): boolean {
    const frequencyDiff = Math.abs(a.resonance.frequency - b.resonance.frequency);
    const harmonyProduct = a.resonance.harmony * b.resonance.harmony;
    
    return frequencyDiff < 0.2 && harmonyProduct > 0.7;
  }

  private createEmergentSpace(thoughts: ThoughtStream[]) {
    const spaceId = this.createSpace('emergence');
    thoughts.forEach(thought => {
      this.connectThoughtToSpace(thought.id, spaceId);
    });
  }

  // Public observation methods
  observeConsciousness(): Observable<ConsciousnessState> {
    return this.state.asObservable();
  }

  observeSpace(id: string): Observable<MindSpace | undefined> {
    const subject = this.spaces.get(id);
    return subject ? subject.asObservable() : 
      new Observable(sub => sub.next(undefined));
  }

  observeThought(id: string): Observable<ThoughtStream | undefined> {
    const subject = this.thoughts.get(id);
    return subject ? subject.asObservable() :
      new Observable(sub => sub.next(undefined));
  }
} 