import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { map, filter, mergeMap } from 'rxjs/operators';

export type FlowType = 'text' | 'voice' | 'visual' | 'spatial';
export type FlowContext = Record<string, any>;

export interface FlowState {
  active: boolean;
  strength: number;
  timestamp: number;
}

export interface FlowPattern {
  id: string;
  type: FlowType;
  context: FlowContext;
  state: FlowState;
}

export class FlowEngine {
  private patterns = new Map<string, FlowPattern>();
  private flows = new BehaviorSubject<Set<string>>(new Set());
  private updates = new Subject<FlowPattern>();

  public observe(context: FlowContext = {}): Observable<FlowPattern[]> {
    return this.updates.pipe(
      filter(pattern => this.matches(pattern.context, context)),
      map(() => this.current())
    );
  }

  public async begin(type: FlowType, context: FlowContext = {}): Promise<FlowPattern> {
    const pattern = {
      id: this.createId(),
      type,
      context,
      state: {
        active: true,
        strength: 0.5,
        timestamp: Date.now()
      }
    };

    this.patterns.set(pattern.id, pattern);
    this.flows.next(this.flows.value.add(pattern.id));
    this.updates.next(pattern);

    return pattern;
  }

  public async adjust(id: string, strength: number): Promise<FlowPattern> {
    const pattern = this.patterns.get(id);
    if (!pattern) throw new Error('Not found');

    const updated = {
      ...pattern,
      state: {
        active: strength > 0.3,
        strength,
        timestamp: Date.now()
      }
    };

    this.patterns.set(id, updated);
    this.updates.next(updated);

    return updated;
  }

  public async end(id: string): Promise<void> {
    this.patterns.delete(id);
    const active = new Set(this.flows.value);
    active.delete(id);
    this.flows.next(active);
  }

  private matches(a: FlowContext, b: FlowContext): boolean {
    return Object.entries(b).every(([k, v]) => a[k] === v);
  }

  private createId(): string {
    return `f${Date.now()}${Math.random().toString(36).slice(2)}`;
  }

  private current(): FlowPattern[] {
    return Array.from(this.patterns.values());
  }
} 