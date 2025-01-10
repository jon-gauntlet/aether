import { Observable, BehaviorSubject } from 'rxjs';
import { Flow, NaturalFlow } from '../types/consciousness';
import type { Stream, PresenceType } from '../types/stream';
import { createEmptyNaturalFlow } from '../factories/flow';

export class FlowEngine implements Flow {
  private flow: NaturalFlow;
  private streams = new Map<string, BehaviorSubject<Stream | undefined>>();
  private currentStream?: Stream;
  
  constructor() {
    this.flow = createEmptyNaturalFlow();
  }

  // Flow interface properties
  get presence(): number { return this.flow.presence; }
  get harmony(): number { return this.flow.harmony; }
  get rhythm(): number { return this.flow.rhythm; }
  get resonance(): number { return this.flow.resonance; }
  get coherence(): number { return this.flow.coherence; }
  
  // Additional Flow metrics
  get pace(): number { return 1; }
  get adaptability(): number { return 1; }
  get emergence(): number { return 1; }
  get balance(): number { return 1; }
  
  // Stream management
  get stream(): Stream | undefined { return this.currentStream; }
  
  get metrics() {
    return {
      depth: this.flow.presence,
      harmony: this.flow.harmony,
      energy: this.flow.resonance,
      resonance: this.flow.resonance,
      presence: this.flow.presence
    };
  }
  
  // NaturalFlow methods
  observeDepth(): Observable<number> {
    return this.flow.observeDepth();
  }
  
  observeEnergy(): Observable<number> {
    return this.flow.observeEnergy();
  }
  
  observeFocus(): Observable<number> {
    return this.flow.observeFocus();
  }
  
  observeResonance(): Observable<number> {
    return this.flow.observeEnergy(); // Use energy as proxy for resonance
  }

  // Navigation methods
  add(id: string, items: any[]): void {
    // TODO: Implement navigation item addition
  }

  wake(id: string): void {
    // TODO: Implement wake functionality
  }

  // Stream observation
  observe(id: string): Observable<Stream | undefined> {
    let subject = this.streams.get(id);
    if (!subject) {
      subject = new BehaviorSubject<Stream | undefined>(undefined);
      this.streams.set(id, subject);
    }
    return subject.asObservable();
  }

  notice(id: string, type: PresenceType): void {
    const subject = this.streams.get(id);
    if (subject) {
      const currentStream = subject.getValue();
      if (currentStream) {
        subject.next({
          ...currentStream,
          lastActivity: Date.now(),
          type
        });
      }
    }
  }

  updatePresence(type: PresenceType): void {
    if (this.currentStream) {
      this.currentStream = {
        ...this.currentStream,
        type,
        lastActivity: Date.now()
      };
    }
  }
} 