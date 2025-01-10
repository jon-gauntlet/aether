import { Observable, BehaviorSubject, merge, Subscriber } from 'rxjs';
import { map, distinctUntilChanged, scan, filter } from 'rxjs/operators';

interface Resonance {
  frequency: number;     // Emotional frequency/vibration
  amplitude: number;     // Emotional intensity
  harmony: number;       // How well it resonates with others
}

interface Depth {
  level: number;        // Current depth level (0-1)
  clarity: number;      // Clarity of understanding (0-1)
  stillness: number;    // Inner quietness (0-1)
  presence: number;     // Degree of being present (0-1)
}

interface ThoughtStream {
  id: string;
  energy: number;          // Life force/vitality (0-1)
  depth: Depth;           // Depth of consciousness
  resonance: Resonance;   // Emotional qualities
  connections: string[];   // Connected streams of consciousness
  context: any[];         // Environmental/situational context
  temperature: number;     // Activity/importance heat (0-1)
  coherence: number;      // Internal harmony/alignment (0-1)
}

interface FlowState {
  streams: Map<string, ThoughtStream>;
  focus: {
    depth: Depth;
    energy: number;
    temperature: number;
    coherence: number;
  };
  patterns: Set<string>;
}

export class NaturalFlow {
  private state: BehaviorSubject<FlowState>;
  private thoughtStreams: Map<string, BehaviorSubject<ThoughtStream>>;
  
  private readonly MERGE_THRESHOLD = 0.8;    // When streams naturally merge
  private readonly SPLIT_THRESHOLD = 0.3;    // When streams naturally split
  private readonly COOL_RATE = 0.98;         // How fast thoughts cool
  private readonly DEPTH_MOMENTUM = 0.95;    // How depth preserves
  private readonly COHERENCE_THRESHOLD = 0.7; // Minimum coherence for connection
  
  constructor() {
    this.state = new BehaviorSubject<FlowState>({
      streams: new Map<string, ThoughtStream>(),
      focus: {
        depth: {
          level: 0,
          clarity: 1,
          stillness: 1,
          presence: 1
        },
        energy: 1,
        temperature: 0.5,
        coherence: 1
      },
      patterns: new Set<string>()
    });
    
    this.thoughtStreams = new Map<string, BehaviorSubject<ThoughtStream>>();
    this.initializeNaturalProcesses();
  }
  
  private initializeNaturalProcesses() {
    setInterval(() => this.adjustTemperature(), 100);
    setInterval(() => this.evolveThoughtStreams(), 250);
    setInterval(() => this.emergePatterns(), 500);
    setInterval(() => this.harmonizeResonance(), 150);
  }
  
  introduceThought(id: string, context: any[] = []) {
    const stream: ThoughtStream = {
      id,
      energy: 1,
      depth: {
        level: 0,
        clarity: 1,
        stillness: 1,
        presence: 1
      },
      resonance: {
        frequency: 0.5,
        amplitude: 0.5,
        harmony: 1
      },
      connections: [],
      context,
      temperature: 1,
      coherence: 1
    };
    
    const streamSubject = new BehaviorSubject<ThoughtStream>(stream);
    this.thoughtStreams.set(id, streamSubject);
    
    const currentState = this.state.value;
    currentState.streams.set(id, stream);
    this.state.next(currentState);
  }
  
  private connectThoughts(sourceId: string, targetId: string) {
    const source = this.thoughtStreams.get(sourceId);
    const target = this.thoughtStreams.get(targetId);
    
    if (source && target) {
      const sourceStream = source.value;
      const targetStream = target.value;
      
      // Only connect if there's sufficient coherence
      if (sourceStream.coherence > this.COHERENCE_THRESHOLD && 
          targetStream.coherence > this.COHERENCE_THRESHOLD) {
            
        if (!sourceStream.connections.includes(targetId)) {
          source.next({
            ...sourceStream,
            connections: [...sourceStream.connections, targetId],
            temperature: Math.min(1, sourceStream.temperature + 0.2),
            resonance: this.harmonizeResonances(sourceStream.resonance, targetStream.resonance)
          });
        }
        
        if (!targetStream.connections.includes(sourceId)) {
          target.next({
            ...targetStream,
            connections: [...targetStream.connections, sourceId],
            temperature: Math.min(1, targetStream.temperature + 0.2),
            resonance: this.harmonizeResonances(targetStream.resonance, sourceStream.resonance)
          });
        }
      }
    }
  }
  
  private harmonizeResonances(a: Resonance, b: Resonance): Resonance {
    return {
      frequency: (a.frequency + b.frequency) / 2,
      amplitude: Math.max(a.amplitude, b.amplitude),
      harmony: Math.min(1, (a.harmony + b.harmony) / 2 + 0.1)
    };
  }
  
  private evolveThoughtStreams() {
    const currentState = this.state.value;
    const streams = Array.from(currentState.streams.values());
    
    // Natural merging of resonant thoughts
    for (let i = 0; i < streams.length; i++) {
      for (let j = i + 1; j < streams.length; j++) {
        const streamA = streams[i];
        const streamB = streams[j];
        
        if (streamA.temperature > this.MERGE_THRESHOLD && 
            streamB.temperature > this.MERGE_THRESHOLD &&
            streamA.resonance.harmony > 0.7 &&
            streamB.resonance.harmony > 0.7) {
          this.connectThoughts(streamA.id, streamB.id);
        }
      }
    }
    
    // Natural fading of dissonant thoughts
    streams.forEach(stream => {
      if (stream.temperature < this.SPLIT_THRESHOLD || 
          stream.coherence < this.COHERENCE_THRESHOLD) {
        const subject = this.thoughtStreams.get(stream.id);
        if (subject) {
          subject.next({
            ...stream,
            connections: stream.connections.filter(conn => {
              const connStream = currentState.streams.get(conn);
              return connStream && 
                     connStream.temperature > this.SPLIT_THRESHOLD &&
                     connStream.coherence > this.COHERENCE_THRESHOLD;
            })
          });
        }
      }
    });
  }
  
  private adjustTemperature() {
    const currentState = this.state.value;
    
    currentState.streams.forEach((stream: ThoughtStream, id: string) => {
      const subject = this.thoughtStreams.get(id);
      if (subject) {
        subject.next({
          ...stream,
          temperature: stream.temperature * this.COOL_RATE,
          depth: {
            ...stream.depth,
            stillness: Math.min(1, stream.depth.stillness + 0.01)
          }
        });
      }
    });
    
    const streams = Array.from(currentState.streams.values());
    const avgTemp = streams.reduce((sum, s) => sum + s.temperature, 0) / streams.length || 0;
    
    this.state.next({
      ...currentState,
      focus: {
        ...currentState.focus,
        temperature: avgTemp
      }
    });
  }
  
  private harmonizeResonance() {
    const currentState = this.state.value;
    const streams = Array.from(currentState.streams.values());
    
    streams.forEach(stream => {
      const connected = stream.connections
        .map(id => currentState.streams.get(id))
        .filter((s): s is ThoughtStream => s !== undefined);
      
      if (connected.length > 0) {
        const avgResonance = connected.reduce((sum, s) => ({
          frequency: sum.frequency + s.resonance.frequency,
          amplitude: sum.amplitude + s.resonance.amplitude,
          harmony: sum.harmony + s.resonance.harmony
        }), { frequency: 0, amplitude: 0, harmony: 0 });
        
        const subject = this.thoughtStreams.get(stream.id);
        if (subject) {
          subject.next({
            ...stream,
            resonance: {
              frequency: avgResonance.frequency / (connected.length + 1),
              amplitude: avgResonance.amplitude / (connected.length + 1),
              harmony: Math.min(1, avgResonance.harmony / connected.length + 0.1)
            }
          });
        }
      }
    });
  }
  
  private emergePatterns() {
    const currentState = this.state.value;
    const streams = Array.from(currentState.streams.values());
    
    const patterns = new Set<string>();
    streams
      .filter(s => s.temperature > 0.7 && s.coherence > this.COHERENCE_THRESHOLD)
      .forEach(stream => {
        const connected = stream.connections
          .map(id => currentState.streams.get(id))
          .filter((s): s is ThoughtStream => 
            s !== undefined && 
            s.temperature > 0.7 && 
            s.coherence > this.COHERENCE_THRESHOLD);
        
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
  
  observeFlow(): Observable<FlowState> {
    return this.state.asObservable();
  }
  
  observeThought(id: string): Observable<ThoughtStream | undefined> {
    const subject = this.thoughtStreams.get(id);
    return subject ? subject.asObservable() : 
      new Observable((subscriber: Subscriber<undefined>) => subscriber.next(undefined));
  }
  
  heatThought(id: string) {
    const subject = this.thoughtStreams.get(id);
    if (subject) {
      const stream = subject.value;
      subject.next({
        ...stream,
        temperature: Math.min(1, stream.temperature + 0.3),
        resonance: {
          ...stream.resonance,
          amplitude: Math.min(1, stream.resonance.amplitude + 0.2)
        }
      });
    }
  }
  
  coolThought(id: string) {
    const subject = this.thoughtStreams.get(id);
    if (subject) {
      const stream = subject.value;
      subject.next({
        ...stream,
        temperature: Math.max(0, stream.temperature - 0.3),
        depth: {
          ...stream.depth,
          stillness: Math.min(1, stream.depth.stillness + 0.2)
        }
      });
    }
  }
  
  // Deepen understanding naturally
  deepenThought(id: string) {
    const subject = this.thoughtStreams.get(id);
    if (subject) {
      const stream = subject.value;
      subject.next({
        ...stream,
        depth: {
          level: Math.min(1, stream.depth.level + 0.1),
          clarity: Math.min(1, stream.depth.clarity + 0.05),
          stillness: Math.min(1, stream.depth.stillness + 0.05),
          presence: Math.min(1, stream.depth.presence + 0.1)
        },
        coherence: Math.min(1, stream.coherence + 0.1)
      });
    }
  }
} 