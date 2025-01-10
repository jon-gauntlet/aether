import { Observable, BehaviorSubject } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
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
  inheritance: {
    depth: number;
    maxDepth: number;
    complexity: number;
    mergeStrategy: 'shallow' | 'deep' | 'selective';
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
  recovery: {
    baseTime: number;
    energyFactor: number;
    adaptivePeriod: number;
    progressiveSteps: number[];
  };
  progression: {
    currentStep: number;
    nextThreshold: number;
    decayRate: number;
    growthRate: number;
  };
}

export class FlowStateGuardian {
  private contexts$ = new BehaviorSubject<Map<string, FlowContext>>(new Map());
  private protections$ = new BehaviorSubject<Map<string, FlowProtection>>(new Map());

  private readonly BASE_PROTECTION_LEVEL = 0.5;
  private readonly MIN_PROTECTION_LEVEL = 0.2;
  private readonly MAX_PROTECTION_LEVEL = 0.9;
  private readonly RECOVERY_BASE_TIME = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.initializeGuardian();
  }

  private initializeGuardian() {
    setInterval(() => {
      this.updateProtections();
    }, 30 * 1000); // Every 30 seconds
  }

  private updateProtections() {
    const protections = this.protections$.value;
    const contexts = this.contexts$.value;
    const updated = new Map(protections);

    for (const [id, protection] of protections) {
      const context = contexts.get(protection.context);
      if (!context) continue;

      updated.set(id, this.evolveProtection(protection, context));
    }

    this.protections$.next(updated);
  }

  private evolveProtection(protection: FlowProtection, context: FlowContext): FlowProtection {
    const energyFactor = context.energy / protection.conditions.minEnergy;
    const coherenceFactor = context.metrics.coherence / protection.conditions.minCoherence;
    
    const newLevel = Math.min(
      this.MAX_PROTECTION_LEVEL,
      Math.max(
        this.MIN_PROTECTION_LEVEL,
        protection.level * (
          energyFactor * 0.6 +
          coherenceFactor * 0.4
        )
      )
    );

    return {
      ...protection,
      level: newLevel,
      progression: {
        ...protection.progression,
        currentStep: Math.floor(newLevel * protection.recovery.progressiveSteps.length),
        nextThreshold: (Math.floor(newLevel * 10) + 1) / 10
      }
    };
  }

  public createContext(parentId?: string): string {
    const id = uuidv4();
    const context: FlowContext = {
      id,
      timestamp: Date.now(),
      energy: 1,
      depth: parentId ? this.getContextDepth(parentId) + 1 : 0,
      patterns: [],
      parentContext: parentId,
      children: [],
      metrics: {
        coherence: 1,
        stability: 1,
        evolution: 0
      },
      inheritance: {
        depth: 0,
        maxDepth: 3,
        complexity: 0,
        mergeStrategy: 'shallow'
      }
    };

    if (parentId) {
      const parent = this.contexts$.value.get(parentId);
      if (parent) {
        this.contexts$.value.set(parentId, {
          ...parent,
          children: [...parent.children, id]
        });
      }
    }

    const contexts = this.contexts$.value;
    contexts.set(id, context);
    this.contexts$.next(contexts);

    this.initializeProtection(id);

    return id;
  }

  private getContextDepth(contextId: string): number {
    const context = this.contexts$.value.get(contextId);
    return context?.depth ?? 0;
  }

  private initializeProtection(contextId: string) {
    const id = uuidv4();
    const protection: FlowProtection = {
      id,
      level: this.BASE_PROTECTION_LEVEL,
      type: 'medium',
      context: contextId,
      conditions: {
        minEnergy: 0.3,
        minCoherence: 0.5,
        maxInterruptions: 3
      },
      recovery: {
        baseTime: this.RECOVERY_BASE_TIME,
        energyFactor: 1.2,
        adaptivePeriod: 15 * 60 * 1000, // 15 minutes
        progressiveSteps: [0.2, 0.4, 0.6, 0.8, 1.0]
      },
      progression: {
        currentStep: 2,
        nextThreshold: 0.6,
        decayRate: 0.1,
        growthRate: 0.2
      }
    };

    const protections = this.protections$.value;
    protections.set(id, protection);
    this.protections$.next(protections);
  }

  public observeContext(contextId: string): Observable<FlowContext | undefined> {
    return this.contexts$.pipe(
      map(contexts => contexts.get(contextId)),
      distinctUntilChanged()
    );
  }

  public observeProtection(contextId: string): Observable<FlowProtection | undefined> {
    return this.protections$.pipe(
      map(protections => 
        Array.from(protections.values()).find(p => p.context === contextId)
      ),
      distinctUntilChanged()
    );
  }
} 