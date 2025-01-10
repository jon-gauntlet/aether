import { Observable, BehaviorSubject, merge } from 'rxjs';
import { map, distinctUntilChanged, scan, filter } from 'rxjs/operators';

interface ThoughtStream {
  id: string;
  energy: number;          // Current energy level (0-1)
  depth: number;           // Depth of thought/focus (0-1)
  connections: string[];   // Connected thought streams
  context: any[];         // Contextual elements
  temperature: number;    // Thought "heat" - how active/important (0-1)
}

interface FlowState {
  streams: Map<string, ThoughtStream>;
  focus: {
    depth: number;        // Current depth level (0-1)
    energy: number;       // Current energy level (0-1)
    temperature: number;  // Overall system temperature (0-1)
  };
  patterns: Set<string>; // Emerged thought patterns
}

export class NaturalFlow {
  private state: BehaviorSubject<FlowState>;
  private thoughtStreams: Map<string, BehaviorSubject<ThoughtStream>>;
  
  private readonly MERGE_THRESHOLD = 0.8;    // When streams naturally merge
  private readonly SPLIT_THRESHOLD = 0.3;    // When streams naturally split
  private readonly COOL_RATE = 0.98;         // How fast thoughts cool
  private readonly DEPTH_MOMENTUM = 0.95;    // How depth preserves
  
  constructor() {
    this.state = new BehaviorSubject<FlowState>({
      streams: new Map(),
      focus: {
        depth: 0,
        energy: 1,
        temperature: 0.5
      },
      patterns: new Set()
    });
    
    this.thoughtStreams = new Map();
    
    // Start natural flow processes
    this.initializeNaturalProcesses();
  }
  
  private initializeNaturalProcesses() {
    // Continuously adjust system temperature
    setInterval(() => this.adjustTemperature(), 100);
    
    // Allow thoughts to naturally merge and split
    setInterval(() => this.evolveThoughtStreams(), 250);
    
    // Let patterns naturally emerge
    setInterval(() => this.emergePatterns(), 500);
  }
  
  // A new thought naturally enters the system
  introduceThought(id: string, context: any[] = []) {
    const stream: ThoughtStream = {
      id,
      energy: 1,
      depth: 0,
      connections: [],
      context,
      temperature: 1
    };
    
    const streamSubject = new BehaviorSubject(stream);
    this.thoughtStreams.set(id, streamSubject);
    
    const currentState = this.state.value;
    currentState.streams.set(id, stream);
    this.state.next(currentState);
  }
  
  // Thoughts naturally connect
  private connectThoughts(sourceId: string, targetId: string) {
    const source = this.thoughtStreams.get(sourceId);
    const target = this.thoughtStreams.get(targetId);
    
    if (source && target) {
      const sourceStream = source.value;
      const targetStream = target.value;
      
      if (!sourceStream.connections.includes(targetId)) {
        source.next({
          ...sourceStream,
          connections: [...sourceStream.connections, targetId],
          temperature: Math.min(1, sourceStream.temperature + 0.2)
        });
      }
      
      if (!targetStream.connections.includes(sourceId)) {
        target.next({
          ...targetStream,
          connections: [...targetStream.connections, sourceId],
          temperature: Math.min(1, targetStream.temperature + 0.2)
        });
      }
    }
  }
  
  // Let thought streams naturally evolve
  private evolveThoughtStreams() {
    const currentState = this.state.value;
    const streams = Array.from(currentState.streams.values());
    
    // Check for natural merging
    for (let i = 0; i < streams.length; i++) {
      for (let j = i + 1; j < streams.length; j++) {
        const streamA = streams[i];
        const streamB = streams[j];
        
        // Thoughts naturally merge when they're hot and connected
        if (streamA.temperature > this.MERGE_THRESHOLD && 
            streamB.temperature > this.MERGE_THRESHOLD) {
          this.connectThoughts(streamA.id, streamB.id);
        }
      }
    }
    
    // Let cold thoughts naturally fade
    streams.forEach(stream => {
      if (stream.temperature < this.SPLIT_THRESHOLD) {
        const subject = this.thoughtStreams.get(stream.id);
        if (subject) {
          subject.next({
            ...stream,
            connections: stream.connections.filter(conn => {
              const connStream = currentState.streams.get(conn);
              return connStream && connStream.temperature > this.SPLIT_THRESHOLD;
            })
          });
        }
      }
    });
  }
  
  // System temperature naturally adjusts
  private adjustTemperature() {
    const currentState = this.state.value;
    
    // Cool all thoughts naturally
    currentState.streams.forEach((stream, id) => {
      const subject = this.thoughtStreams.get(id);
      if (subject) {
        subject.next({
          ...stream,
          temperature: stream.temperature * this.COOL_RATE
        });
      }
    });
    
    // Overall system temperature follows thought temperatures
    const avgTemp = Array.from(currentState.streams.values())
      .reduce((sum, s) => sum + s.temperature, 0) / currentState.streams.size || 0;
    
    this.state.next({
      ...currentState,
      focus: {
        ...currentState.focus,
        temperature: avgTemp
      }
    });
  }
  
  // Patterns naturally emerge from thought flows
  private emergePatterns() {
    const currentState = this.state.value;
    const streams = Array.from(currentState.streams.values());
    
    // Find groups of connected hot thoughts
    const patterns = new Set<string>();
    streams
      .filter(s => s.temperature > 0.7)
      .forEach(stream => {
        const connected = stream.connections
          .map(id => currentState.streams.get(id))
          .filter(s => s && s.temperature > 0.7);
        
        if (connected.length > 2) {
          patterns.add(`pattern_${stream.id}`);
        }
      });
    
    if (patterns.size !== currentState.patterns.size) {
      this.state.next({
        ...currentState,
        patterns
      });
    }
  }
  
  // Observe the natural flow of thoughts
  observeFlow(): Observable<FlowState> {
    return this.state.asObservable();
  }
  
  // Observe a specific thought stream
  observeThought(id: string): Observable<ThoughtStream | undefined> {
    const subject = this.thoughtStreams.get(id);
    return subject ? subject.asObservable() : 
      new Observable(sub => sub.next(undefined));
  }
  
  // Heat up a thought (give it energy/importance)
  heatThought(id: string) {
    const subject = this.thoughtStreams.get(id);
    if (subject) {
      const stream = subject.value;
      subject.next({
        ...stream,
        temperature: Math.min(1, stream.temperature + 0.3)
      });
    }
  }
  
  // Let a thought naturally cool
  coolThought(id: string) {
    const subject = this.thoughtStreams.get(id);
    if (subject) {
      const stream = subject.value;
      subject.next({
        ...stream,
        temperature: Math.max(0, stream.temperature - 0.3)
      });
    }
  }
} 