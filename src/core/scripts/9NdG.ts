import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { EnergyState } from '../energy/EnergySystem';
import { v4 as uuidv4 } from 'uuid';

export interface FlowContext {
  id: string;
  timestamp: number;
  energy: number;
  depth: number;
  patterns: string[];
  parentContext?: string;
  children: string[];
  metrics: {
    coherence: number;
    stability: number;
    evolution: number;
  };
}

export interface FlowProtection {
  id: string;
  level: number;
  type: 'soft' | 'medium' | 'hard';
  context: string;
  conditions: {
    minEnergy: number;
    minCoherence: number;
    maxInterruptions: number;
  };
}

export class FlowStateGuardian {
  private contexts$ = new BehaviorSubject<Map<string, FlowContext>>(new Map());
  private protection$ = new BehaviorSubject<Map<string, FlowProtection>>(new Map());
  private interruptions$ = new BehaviorSubject<number>(0);
  
  private readonly PROTECTION_THRESHOLD = 0.8;
  private readonly CONTEXT_INHERITANCE_DEPTH = 3;

  constructor() {
    this.startProtectionCycle();
  }

  private startProtectionCycle() {
    setInterval(() => {
      this.evolveContexts();
      this.adjustProtection();
    }, 2000);
  }

  private evolveContexts() {
    const contexts = this.contexts$.value;
    let evolved = false;

    contexts.forEach((context, id) => {
      const children = Array.from(contexts.values())
        .filter(c => c.parentContext === id);

      // Natural context evolution
      const childMetrics = children.map(c => c.metrics);
      const avgChildCoherence = this.calculateAverage(childMetrics.map(m => m.coherence));
      const avgChildStability = this.calculateAverage(childMetrics.map(m => m.stability));
      const avgChildEvolution = this.calculateAverage(childMetrics.map(m => m.evolution));

      const evolvedContext = {
        ...context,
        depth: Math.min(10, context.depth + (avgChildEvolution > 0.7 ? 0.1 : 0)),
        metrics: {
          coherence: (context.metrics.coherence * 0.7) + (avgChildCoherence * 0.3),
          stability: (context.metrics.stability * 0.7) + (avgChildStability * 0.3),
          evolution: avgChildEvolution
        }
      };

      if (JSON.stringify(evolvedContext) !== JSON.stringify(context)) {
        contexts.set(id, evolvedContext);
        evolved = true;
      }
    });

    if (evolved) {
      this.contexts$.next(new Map(contexts));
    }
  }

  private adjustProtection() {
    const contexts = this.contexts$.value;
    const protection = this.protection$.value;
    let updated = false;

    protection.forEach((prot, id) => {
      const context = contexts.get(prot.context);
      if (!context) return;

      // Natural protection adjustment
      const newLevel = this.calculateProtectionLevel(context, prot);
      if (newLevel !== prot.level) {
        protection.set(id, {
          ...prot,
          level: newLevel,
          type: this.determineProtectionType(newLevel)
        });
        updated = true;
      }
    });

    if (updated) {
      this.protection$.next(new Map(protection));
    }
  }

  private calculateProtectionLevel(context: FlowContext, protection: FlowProtection): number {
    const energyFactor = context.energy >= protection.conditions.minEnergy ? 0.4 : 0;
    const coherenceFactor = context.metrics.coherence >= protection.conditions.minCoherence ? 0.3 : 0;
    const interruptionFactor = this.interruptions$.value <= protection.conditions.maxInterruptions ? 0.3 : 0;

    return energyFactor + coherenceFactor + interruptionFactor;
  }

  private determineProtectionType(level: number): FlowProtection['type'] {
    if (level >= 0.8) return 'hard';
    if (level >= 0.5) return 'medium';
    return 'soft';
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  public createContext(
    energy: number,
    patterns: string[],
    parentContext?: string
  ): string {
    const id = uuidv4();
    const context: FlowContext = {
      id,
      timestamp: Date.now(),
      energy,
      depth: 1,
      patterns,
      parentContext,
      children: [],
      metrics: {
        coherence: 0.5,
        stability: 0.5,
        evolution: 0.1
      }
    };

    // Update parent's children
    if (parentContext) {
      const parent = this.contexts$.value.get(parentContext);
      if (parent) {
        this.contexts$.value.set(parentContext, {
          ...parent,
          children: [...parent.children, id]
        });
      }
    }

    const contexts = this.contexts$.value;
    contexts.set(id, context);
    this.contexts$.next(contexts);

    // Create natural protection
    this.createProtection(id);

    return id;
  }

  private createProtection(contextId: string): string {
    const id = uuidv4();
    const protection: FlowProtection = {
      id,
      level: 0.5,
      type: 'medium',
      context: contextId,
      conditions: {
        minEnergy: 0.7,
        minCoherence: 0.6,
        maxInterruptions: 3
      }
    };

    const protections = this.protection$.value;
    protections.set(id, protection);
    this.protection$.next(protections);

    return id;
  }

  public recordInterruption() {
    this.interruptions$.next(this.interruptions$.value + 1);
    
    // Natural interruption recovery
    setTimeout(() => {
      this.interruptions$.next(Math.max(0, this.interruptions$.value - 1));
    }, 30 * 60 * 1000); // 30 minutes
  }

  public canInterrupt(contextId: string): boolean {
    const context = this.contexts$.value.get(contextId);
    if (!context) return true;

    const protection = Array.from(this.protection$.value.values())
      .find(p => p.context === contextId);
    if (!protection) return true;

    switch (protection.type) {
      case 'hard':
        return false;
      case 'medium':
        return this.interruptions$.value < protection.conditions.maxInterruptions;
      case 'soft':
        return true;
    }
  }

  public getContextChain(contextId: string): FlowContext[] {
    const chain: FlowContext[] = [];
    let current = this.contexts$.value.get(contextId);

    while (current && chain.length < this.CONTEXT_INHERITANCE_DEPTH) {
      chain.push(current);
      if (current.parentContext) {
        current = this.contexts$.value.get(current.parentContext);
      } else {
        break;
      }
    }

    return chain;
  }

  public observeContext(contextId: string): Observable<FlowContext | undefined> {
    return this.contexts$.pipe(
      map(contexts => contexts.get(contextId)),
      distinctUntilChanged()
    );
  }

  public observeProtection(contextId: string): Observable<FlowProtection | undefined> {
    return this.protection$.pipe(
      map(protections => 
        Array.from(protections.values()).find(p => p.context === contextId)
      ),
      distinctUntilChanged()
    );
  }

  public getContextMetrics(contextId: string): {
    depth: number;
    coherence: number;
    stability: number;
    evolution: number;
    protectionLevel: number;
    interruptions: number;
  } | undefined {
    const context = this.contexts$.value.get(contextId);
    if (!context) return undefined;

    const protection = Array.from(this.protection$.value.values())
      .find(p => p.context === contextId);

    return {
      depth: context.depth,
      coherence: context.metrics.coherence,
      stability: context.metrics.stability,
      evolution: context.metrics.evolution,
      protectionLevel: protection?.level ?? 0,
      interruptions: this.interruptions$.value
    };
  }
} 