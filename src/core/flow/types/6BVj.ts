import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { map, filter, mergeMap, debounceTime } from 'rxjs/operators';
import { Resonance, Flow, Field, Wave, Protection } from '../types/consciousness';

export type FlowType = 'focus' | 'rest' | 'connect' | 'create';
export type FlowDepth = 'surface' | 'shallow' | 'deep' | 'profound';
export type FlowContext = Record<string, any>;

export interface FlowState {
  active: boolean;
  depth: FlowDepth;
  energy: number;
  resonance: Resonance;
  protection: Protection;
  timestamp: number;
}

export interface FlowPattern {
  id: string;
  type: FlowType;
  context: FlowContext;
  state: FlowState;
  field: Field;
}

export class FlowEngine {
  private patterns = new Map<string, FlowPattern>();
  private flows = new BehaviorSubject<Set<string>>(new Set());
  private updates = new Subject<FlowPattern>();
  private resonance = new BehaviorSubject<Resonance>({
    frequency: 0.5,    // Natural rhythm
    amplitude: 0.5,    // Wave height
    harmony: 0.5,      // Pattern coherence
    field: {
      center: { x: 0, y: 0, z: 0 },
      radius: 1,
      strength: 0.5,
      waves: []
    }
  });

  public observe(context: FlowContext = {}): Observable<FlowPattern[]> {
    return this.updates.pipe(
      debounceTime(100), // Natural rhythm
      filter(pattern => this.matches(pattern.context, context)),
      map(() => this.current())
    );
  }

  public observeResonance(): Observable<Resonance> {
    return this.resonance.asObservable();
  }

  public async begin(type: FlowType, context: FlowContext = {}): Promise<FlowPattern> {
    // Create natural flow pattern
    const pattern = {
      id: this.createId(),
      type,
      context,
      state: {
        active: true,
        depth: 'surface',
        energy: 0.5,
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
      }
    };

    // Natural integration
    this.patterns.set(pattern.id, pattern);
    this.flows.next(new Set([...this.flows.value, pattern.id]));
    this.updates.next(pattern);
    await this.updateResonance();

    return pattern;
  }

  public async adjust(id: string, changes: Partial<FlowState>): Promise<FlowPattern> {
    const pattern = this.patterns.get(id);
    if (!pattern) throw new Error('Flow pattern not found');

    // Natural adaptation
    const updated = {
      ...pattern,
      state: {
        ...pattern.state,
        ...changes,
        timestamp: Date.now()
      }
    };

    // Protect deep states
    if (updated.state.depth === 'deep' || updated.state.depth === 'profound') {
      updated.state.protection.strength = Math.max(updated.state.protection.strength, 0.7);
    }

    this.patterns.set(id, updated);
    this.updates.next(updated);
    await this.updateResonance();

    return updated;
  }

  public async end(id: string): Promise<void> {
    // Natural completion
    const pattern = this.patterns.get(id);
    if (pattern) {
      // Gradual release
      await this.adjust(id, { 
        active: false, 
        energy: 0,
        protection: {
          strength: 0,
          resilience: 0,
          adaptability: 0
        }
      });
      
      this.patterns.delete(id);
      const active = new Set(this.flows.value);
      active.delete(id);
      this.flows.next(active);
      await this.updateResonance();
    }
  }

  private async updateResonance(): Promise<void> {
    // Calculate natural system resonance
    const patterns = this.current();
    if (patterns.length === 0) {
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

    // Harmonize all active patterns
    const resonance: Resonance = {
      frequency: patterns.reduce((acc, p) => acc + p.state.resonance.frequency, 0) / patterns.length,
      amplitude: patterns.reduce((acc, p) => acc + p.state.resonance.amplitude, 0) / patterns.length,
      harmony: this.calculateHarmony(patterns),
      field: this.calculateField(patterns)
    };

    this.resonance.next(resonance);
  }

  private calculateHarmony(patterns: FlowPattern[]): number {
    if (patterns.length <= 1) return 1;
    
    // Calculate resonance between patterns
    let totalHarmony = 0;
    let connections = 0;
    
    for (let i = 0; i < patterns.length; i++) {
      for (let j = i + 1; j < patterns.length; j++) {
        const a = patterns[i];
        const b = patterns[j];
        
        // Natural resonance calculation
        const freqDiff = Math.abs(a.state.resonance.frequency - b.state.resonance.frequency);
        const ampDiff = Math.abs(a.state.resonance.amplitude - b.state.resonance.amplitude);
        const harmony = 1 - (freqDiff + ampDiff) / 2;
        
        totalHarmony += harmony;
        connections++;
      }
    }
    
    return connections > 0 ? totalHarmony / connections : 1;
  }

  private calculateField(patterns: FlowPattern[]): Field {
    // Combine all pattern fields
    const fields = patterns.map(p => p.field);
    
    // Find the center of mass
    const center = {
      x: fields.reduce((acc, f) => acc + f.center.x * f.strength, 0) / fields.length,
      y: fields.reduce((acc, f) => acc + f.center.y * f.strength, 0) / fields.length,
      z: fields.reduce((acc, f) => acc + f.center.z * f.strength, 0) / fields.length
    };
    
    // Calculate combined radius and strength
    const radius = Math.max(...fields.map(f => f.radius));
    const strength = fields.reduce((acc, f) => acc + f.strength, 0) / fields.length;
    
    // Combine waves
    const waves = fields.flatMap(f => f.waves)
      .sort((a, b) => b.amplitude - a.amplitude)
      .slice(0, 5); // Keep strongest waves
    
    return { center, radius, strength, waves };
  }

  private matches(a: FlowContext, b: FlowContext): boolean {
    return Object.entries(b).every(([k, v]) => a[k] === v);
  }

  private createId(): string {
    return `flow_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }

  private current(): FlowPattern[] {
    return Array.from(this.patterns.values());
  }
} 