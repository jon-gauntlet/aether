import { BehaviorSubject, Observable } from 'rxjs';
import { FlowContext, FlowProtection, NaturalFlowType } from '../types/base';

export class FlowStateGuardian {
  private contexts: Map<string, BehaviorSubject<FlowContext>> = new Map();
  private protections: Map<string, BehaviorSubject<FlowProtection>> = new Map();

  createContext(): string {
    const id = Math.random().toString(36).substring(7);
    this.contexts.set(id, new BehaviorSubject<FlowContext>({
      depth: 0.5,
      metrics: {
        coherence: 0.5,
        stability: 0.5,
        quality: 0.5
      },
      mode: 'natural'
    }));
    this.protections.set(id, new BehaviorSubject<FlowProtection>({
      level: 0.5,
      type: 'soft'
    }));
    return id;
  }

  setMode(contextId: string, mode: NaturalFlowType): void {
    const context = this.contexts.get(contextId);
    if (context) {
      context.next({
        ...context.value,
        mode
      });
    }
  }

  observeContext(contextId: string): Observable<FlowContext> {
    return this.contexts.get(contextId) as Observable<FlowContext>;
  }

  observeProtection(contextId: string): Observable<FlowProtection> {
    return this.protections.get(contextId) as Observable<FlowProtection>;
  }
} 