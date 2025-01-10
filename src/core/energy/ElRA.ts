import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Flow,
  FlowType,
  FlowPattern,
  FlowState,
  FlowContext,
  FlowMetrics,
  Resonance,
  Field,
  Protection,
  NaturalCycles
} from './types';

export class FlowEngine {
  private patterns: Map<string, BehaviorSubject<FlowPattern>> = new Map();
  private flows: BehaviorSubject<Set<string>> = new BehaviorSubject<Set<string>>(new Set());
  private resonance: BehaviorSubject<Resonance>;
  private updates: BehaviorSubject<FlowPattern | null> = new BehaviorSubject<FlowPattern | null>(null);

  constructor() {
    this.resonance = new BehaviorSubject<Resonance>({
      frequency: 0.5,
      amplitude: 0.5,
      harmony: 0.5,
      divine: 0.5,
      field: this.createInitialField()
    });
  }

  private createInitialField(): Field {
    return {
      center: { x: 0, y: 0, z: 0 },
      radius: 1,
      strength: 0.5,
      waves: []
    };
  }

  public async begin(type: FlowType, context: FlowContext = {}): Promise<FlowPattern> {
    const id = `flow_${Date.now()}`;
    const pattern: FlowPattern = {
      id,
      type,
      context,
      state: {
        active: true,
        depth: 'surface',
        energy: 0.5,
        resonance: this.resonance.value,
        harmony: 0.5,
        naturalCycles: {
          rhythm: 0.5,
          resonance: 0.5,
          harmony: 0.5
        },
        protection: {
          strength: 0.3,
          resilience: 0.3,
          adaptability: 0.3
        },
        timestamp: Date.now()
      }
    };

    // Natural integration
    this.patterns.set(pattern.id, new BehaviorSubject(pattern));
    this.flows.next(new Set([...this.flows.value, pattern.id]));
    this.updates.next(pattern);
    await this.updateResonance();

    return pattern;
  }

  public async end(id: string): Promise<void> {
    const pattern = this.patterns.get(id);
    if (pattern) {
      pattern.complete();
      this.patterns.delete(id);
      const newFlows = new Set(this.flows.value);
      newFlows.delete(id);
      this.flows.next(newFlows);
      await this.updateResonance();
    }
  }

  public observe(id: string): Observable<FlowPattern | null> {
    const subject = this.patterns.get(id);
    return subject ? subject.asObservable() : 
      new Observable(sub => sub.next(null));
  }

  public observeResonance(): Observable<Resonance> {
    return this.resonance.asObservable();
  }

  public observeMetrics(): Observable<FlowMetrics> {
    return this.updates.pipe(
      map(() => this.calculateMetrics())
    );
  }

  private calculateMetrics(): FlowMetrics {
    const patterns = this.current();
    return {
      depth: this.calculateDepth(patterns),
      harmony: this.calculateHarmony(patterns),
      energy: this.calculateEnergy(patterns),
      focus: this.calculateFocus(patterns)
    };
  }

  private current(): FlowPattern[] {
    return Array.from(this.patterns.values())
      .map(subject => subject.value)
      .filter(pattern => pattern.state.active);
  }

  private async updateResonance(): Promise<void> {
    const patterns = this.current();
    if (patterns.length === 0) {
      this.resonance.next({
        frequency: 0.5,
        amplitude: 0.5,
        harmony: 0.5,
        divine: 0.5,
        field: this.createInitialField()
      });
      return;
    }

    // Harmonize all active patterns
    const resonance: Resonance = {
      frequency: patterns.reduce((acc, p) => acc + p.state.resonance.frequency, 0) / patterns.length,
      amplitude: patterns.reduce((acc, p) => acc + p.state.resonance.amplitude, 0) / patterns.length,
      harmony: this.calculateHarmony(patterns),
      divine: patterns.reduce((acc, p) => acc + p.state.resonance.divine, 0) / patterns.length,
      field: this.createInitialField()
    };

    this.resonance.next(resonance);
  }

  private calculateHarmony(patterns: FlowPattern[]): number {
    if (patterns.length === 0) return 0.5;
    return patterns.reduce((acc, p) => acc + p.state.harmony, 0) / patterns.length;
  }

  private calculateDepth(patterns: FlowPattern[]): number {
    if (patterns.length === 0) return 0;
    return patterns.reduce((acc, p) => {
      switch (p.state.depth) {
        case 'profound': return acc + 1;
        case 'deep': return acc + 0.75;
        case 'shallow': return acc + 0.5;
        default: return acc + 0.25;
      }
    }, 0) / patterns.length;
  }

  private calculateEnergy(patterns: FlowPattern[]): number {
    if (patterns.length === 0) return 0.5;
    return patterns.reduce((acc, p) => acc + p.state.energy, 0) / patterns.length;
  }

  private calculateFocus(patterns: FlowPattern[]): number {
    if (patterns.length === 0) return 0.5;
    return patterns.reduce((acc, p) => {
      const { protection, resonance } = p.state;
      return acc + (protection.strength * resonance.amplitude);
    }, 0) / patterns.length;
  }
} 