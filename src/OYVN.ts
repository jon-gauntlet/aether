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
  Harmonic,
  DivineHarmony,
  HumanPresence,
  NaturalFlow
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
    
    // Initialize base consciousness state with three-fold harmony
    this.state = new BehaviorSubject<ConsciousnessState>(this.createInitialState());

    this.initializeNaturalProcesses();
  }

  private initializeNaturalProcesses() {
    // Divine harmony maintenance
    setInterval(() => this.maintainDivineHarmony(), 100);
    
    // Human presence deepening
    setInterval(() => this.deepenHumanPresence(), 150);
    
    // Natural flow evolution
    setInterval(() => this.evolveNaturalFlow(), 200);
    
    // Three-fold integration
    setInterval(() => this.integrateAllDimensions(), 300);
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

  private createBaseDivineHarmony(): DivineHarmony {
    return {
      truth: 1,          // Alignment with divine truth
      purpose: 1,        // Connection to higher purpose
      wisdom: 1,         // Divine wisdom integration
      reverence: 1       // Sacred respect and honor
    };
  }

  private createBaseHumanPresence(): HumanPresence {
    return {
      authenticity: 1,   // Genuine human expression
      connection: 1,     // Deep human connection
      understanding: 1,  // Mutual understanding
      growth: 1         // Personal and collective growth
    };
  }

  private createBaseNaturalFlow(): NaturalFlow {
    return {
      rhythm: 1,         // Natural timing and pacing
      adaptation: 1,     // Organic adaptation
      emergence: 1,      // Natural pattern emergence
      harmony: 1         // Environmental harmony
    };
  }

  // Initialize base consciousness state with three-fold harmony
  private createInitialState(): ConsciousnessState {
    return {
      id: 'root',
      resonance: this.createBaseResonance(),
      depth: this.createBaseDepth(),
      energy: 1,
      coherence: 1,
      presence: 1,
      divineHarmony: this.createBaseDivineHarmony(),
      humanPresence: this.createBaseHumanPresence(),
      naturalFlow: this.createBaseNaturalFlow()
    };
  }

  // Create a new connection between thoughts
  private createConnection(
    sourceId: string,
    targetId: string,
    strength: number,
    type: 'resonance' | 'intention' | 'meaning'
  ): Connection {
    return {
      id: `conn_${sourceId}_${targetId}`,
      sourceId,
      targetId,
      strength,
      type,
      resonance: this.createBaseResonance()
    };
  }

  // Integrate dimensions safely with null checks
  private integrateAllDimensions(
    divine: DivineHarmony,
    human: HumanPresence,
    natural: NaturalFlow
  ): ConsciousnessState {
    const resonance = this.createHarmonizedResonance(divine, human, natural);
    const depth = this.createHarmonizedDepth(divine, human, natural);
    
    const coherence = (
      this.calculateDivineCoherence(divine) +
      this.calculateHumanCoherence(human) +
      this.calculateNaturalCoherence(natural)
    ) / 3;
    
    const presence = (
      divine.reverence +
      human.connection +
      natural.harmony
    ) / 3;

    return {
      id: `state_${Date.now()}`,
      resonance,
      depth,
      energy: 1,
      coherence,
      presence,
      divineHarmony: divine,
      humanPresence: human,
      naturalFlow: natural
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

  private maintainDivineHarmony() {
    const currentState = this.state.value;
    const spaces = Array.from(this.spaces.values()).map(s => s.value);
    
    // Calculate divine resonance across spaces
    const divineHarmony = spaces.reduce(
      (harmony, space) => this.harmonizeDivineAspects(harmony, space),
      this.createBaseDivineHarmony()
    );

    this.state.next({
      ...currentState,
      divineHarmony
    });
  }

  private deepenHumanPresence() {
    const currentState = this.state.value;
    const thoughts = Array.from(this.thoughts.values()).map(t => t.value);
    
    // Deepen human connection through thoughts
    const humanPresence = thoughts.reduce(
      (presence, thought) => this.deepenHumanAspects(presence, thought),
      this.createBaseHumanPresence()
    );

    this.state.next({
      ...currentState,
      humanPresence
    });
  }

  private evolveNaturalFlow() {
    const currentState = this.state.value;
    const spaces = Array.from(this.spaces.values()).map(s => s.value);
    const thoughts = Array.from(this.thoughts.values()).map(t => t.value);
    
    // Let natural patterns emerge
    const naturalFlow = this.calculateNaturalEvolution(
      currentState.naturalFlow,
      spaces,
      thoughts
    );

    this.state.next({
      ...currentState,
      naturalFlow
    });
  }

  private harmonizeDivineAspects(
    harmony: DivineHarmony,
    space: MindSpace
  ): DivineHarmony {
    return {
      truth: this.evolveAttribute(harmony.truth, space.state.coherence),
      purpose: this.evolveAttribute(harmony.purpose, space.state.presence),
      wisdom: this.evolveAttribute(harmony.wisdom, space.state.depth.clarity),
      reverence: this.evolveAttribute(harmony.reverence, space.state.resonance.harmony)
    };
  }

  private deepenHumanAspects(
    presence: HumanPresence,
    thought: ThoughtStream
  ): HumanPresence {
    return {
      authenticity: this.evolveAttribute(presence.authenticity, thought.resonance.harmony),
      connection: this.evolveAttribute(presence.connection, thought.depth.presence),
      understanding: this.evolveAttribute(presence.understanding, thought.coherence),
      growth: this.evolveAttribute(presence.growth, thought.depth.clarity)
    };
  }

  private calculateNaturalEvolution(
    current: NaturalFlow,
    spaces: MindSpace[],
    thoughts: ThoughtStream[]
  ): NaturalFlow {
    // Calculate overall system state
    const systemCoherence = this.calculateSystemCoherence(spaces);
    const systemPresence = this.calculateSystemPresence(thoughts);
    
    return {
      rhythm: this.evolveAttribute(current.rhythm, systemCoherence),
      adaptation: this.evolveAttribute(current.adaptation, systemPresence),
      emergence: this.evolveAttribute(current.emergence, spaces.length / 10),
      harmony: this.evolveAttribute(current.harmony, thoughts.length / 20)
    };
  }

  private calculateSystemCoherence(spaces: MindSpace[]): number {
    if (spaces.length === 0) return 0;
    return spaces.reduce((sum, space) => 
      sum + space.state.coherence, 0
    ) / spaces.length;
  }

  private calculateSystemPresence(thoughts: ThoughtStream[]): number {
    if (thoughts.length === 0) return 0;
    return thoughts.reduce((sum, thought) =>
      sum + thought.depth.presence, 0
    ) / thoughts.length;
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

  private createHarmonizedResonance(
    divine: DivineHarmony,
    human: HumanPresence,
    natural: NaturalFlow
  ): Resonance {
    // Blend all aspects into resonance
    const frequency = (
      (divine.wisdom * 0.4) +
      (human.understanding * 0.3) +
      (natural.rhythm * 0.3)
    ) * this.meta.baseFrequency;

    const amplitude = (
      (divine.reverence * 0.4) +
      (human.authenticity * 0.3) +
      (natural.adaptation * 0.3)
    ) * this.meta.baseAmplitude;

    const harmony = (
      (divine.truth * 0.4) +
      (human.connection * 0.3) +
      (natural.harmony * 0.3)
    );

    return {
      frequency,
      amplitude,
      harmony,
      field: {
        center: { x: 0, y: 0, z: 0 },
        radius: 1 + harmony,
        strength: amplitude,
        harmonics: []
      }
    };
  }

  private createHarmonizedDepth(
    divine: DivineHarmony,
    human: HumanPresence,
    natural: NaturalFlow
  ): Depth {
    return {
      level: (divine.wisdom + human.understanding + natural.emergence) / 3,
      clarity: (divine.truth + human.authenticity + natural.rhythm) / 3,
      stillness: (divine.reverence + human.connection + natural.harmony) / 3,
      presence: (divine.purpose + human.growth + natural.adaptation) / 3
    };
  }

  private calculateDivineCoherence(divine: DivineHarmony): number {
    return (
      divine.truth +
      divine.purpose +
      divine.wisdom +
      divine.reverence
    ) / 4;
  }

  private calculateHumanCoherence(human: HumanPresence): number {
    return (
      human.authenticity +
      human.connection +
      human.understanding +
      human.growth
    ) / 4;
  }

  private calculateNaturalCoherence(natural: NaturalFlow): number {
    return (
      natural.rhythm +
      natural.adaptation +
      natural.emergence +
      natural.harmony
    ) / 4;
  }

  private evolveAttribute(current: number, influence: number): number {
    const delta = (influence - current) * 0.1;
    return Math.max(0, Math.min(1, current + delta));
  }
} 