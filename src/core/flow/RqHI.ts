import { BehaviorSubject, Observable } from 'rxjs';
import { Flow, FlowType, FlowTransition } from '../types/flow';

export class FlowEngine {
  private flow$: BehaviorSubject<Flow>;
  
  constructor(public readonly id: string) {
    this.flow$ = new BehaviorSubject<Flow>({
      state: 'natural',
      context: {
        type: 'development',
        depth: 1,
        duration: 0
      },
      metrics: {
        focus: 1,
        presence: 1,
        coherence: 1,
        sustainability: 1,
        depth: 1,
        harmony: 1
      },
      protection: {
        level: 1,
        type: 'natural',
        strength: 1
      }
    });
  }

  async measure(): Promise<Flow> {
    return this.flow$.value;
  }

  async transition(to: FlowType, trigger: string): Promise<FlowTransition> {
    const current = this.flow$.value;
    const transition: FlowTransition = {
      from: current.state,
      to,
      trigger,
      quality: current.metrics.coherence
    };

    this.flow$.next({
      ...current,
      state: to,
      metrics: {
        ...current.metrics,
        coherence: Math.min(1, current.metrics.coherence + 0.1)
      }
    });

    return transition;
  }

  setMode(mode: FlowType): void {
    const current = this.flow$.value;
    this.flow$.next({
      ...current,
      state: mode
    });
  }

  async deepen(): Promise<void> {
    const current = this.flow$.value;
    this.flow$.next({
      ...current,
      context: {
        ...current.context,
        depth: Math.min(1, current.context.depth + 0.1)
      },
      metrics: {
        ...current.metrics,
        focus: Math.min(1, current.metrics.focus + 0.1),
        presence: Math.min(1, current.metrics.presence + 0.1)
      }
    });
  }

  async protect(): Promise<void> {
    const current = this.flow$.value;
    this.flow$.next({
      ...current,
      state: 'protected',
      protection: {
        ...current.protection,
        level: Math.min(1, current.protection.level + 0.2),
        strength: Math.min(1, current.protection.strength + 0.1)
      }
    });
  }

  observe(): Observable<Flow> {
    return this.flow$.asObservable();
  }
}