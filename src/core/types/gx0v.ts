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
  private protection$ = new BehaviorSubject<Map<string, FlowProtection>>(new Map());
  private interruptions$ = new BehaviorSubject<number>(0);
  
  private readonly PROTECTION_THRESHOLD = 0.8;
  private readonly BASE_RECOVERY_TIME = 30 * 60 * 1000; // 30 minutes
  private readonly MIN_RECOVERY_TIME = 5 * 60 * 1000;  // 5 minutes
  private readonly MAX_RECOVERY_TIME = 60 * 60 * 1000; // 60 minutes

  constructor() {
    this.startProtectionCycle();
  }

  private startProtectionCycle() {
    setInterval(() => {
      this.evolveContexts();
      this.adjustProtection();
      this.manageRecovery();
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

      // Dynamic inheritance depth based on complexity
      const complexityFactor = this.calculateComplexityFactor(context);
      const newMaxDepth = Math.max(3, Math.min(10, Math.ceil(complexityFactor * 5)));

      const evolvedContext = {
        ...context,
        depth: Math.min(10, context.depth + (avgChildEvolution > 0.7 ? 0.1 : 0)),
        metrics: {
          coherence: (context.metrics.coherence * 0.7) + (avgChildCoherence * 0.3),
          stability: (context.metrics.stability * 0.7) + (avgChildStability * 0.3),
          evolution: avgChildEvolution
        },
        inheritance: {
          ...context.inheritance,
          maxDepth: newMaxDepth,
          complexity: complexityFactor,
          mergeStrategy: this.determineMergeStrategy(complexityFactor)
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
      
      // Progressive protection evolution
      const progression = this.evolveProgression(prot.progression, newLevel);

      if (newLevel !== prot.level || progression.currentStep !== prot.progression.currentStep) {
        protection.set(id, {
          ...prot,
          level: newLevel,
          type: this.determineProtectionType(newLevel),
          progression
        });
        updated = true;
      }
    });

    if (updated) {
      this.protection$.next(new Map(protection));
    }
  }

  private manageRecovery() {
    const protection = this.protection$.value;
    let updated = false;

    protection.forEach((prot, id) => {
      const newRecovery = this.calculateAdaptiveRecovery(prot);
      if (JSON.stringify(newRecovery) !== JSON.stringify(prot.recovery)) {
        protection.set(id, {
          ...prot,
          recovery: newRecovery
        });
        updated = true;
      }
    });

    if (updated) {
      this.protection$.next(new Map(protection));
    }
  }

  private calculateComplexityFactor(context: FlowContext): number {
    const patternComplexity = context.patterns.length / 10;
    const depthComplexity = context.depth / 5;
    const metricsComplexity = (
      context.metrics.coherence +
      context.metrics.stability +
      context.metrics.evolution
    ) / 3;

    return (patternComplexity * 0.4) + (depthComplexity * 0.3) + (metricsComplexity * 0.3);
  }

  private determineMergeStrategy(complexity: number): FlowContext['inheritance']['mergeStrategy'] {
    if (complexity > 0.8) return 'deep';
    if (complexity > 0.4) return 'selective';
    return 'shallow';
  }

  private evolveProgression(
    current: FlowProtection['progression'],
    newLevel: number
  ): FlowProtection['progression'] {
    const levelDiff = newLevel - current.nextThreshold;
    
    if (levelDiff >= 0.2) {
      // Progress to next step
      return {
        currentStep: Math.min(10, current.currentStep + 1),
        nextThreshold: newLevel + 0.1,
        decayRate: Math.max(0.01, current.decayRate * 0.9),
        growthRate: Math.min(0.2, current.growthRate * 1.1)
      };
    } else if (levelDiff <= -0.2) {
      // Regress to previous step
      return {
        currentStep: Math.max(0, current.currentStep - 1),
        nextThreshold: newLevel - 0.1,
        decayRate: Math.min(0.1, current.decayRate * 1.1),
        growthRate: Math.max(0.01, current.growthRate * 0.9)
      };
    }

    return current;
  }

  private calculateAdaptiveRecovery(protection: FlowProtection): FlowProtection['recovery'] {
    const effectiveTime = protection.recovery.baseTime * protection.recovery.energyFactor;
    const adaptivePeriod = Math.max(
      this.MIN_RECOVERY_TIME,
      Math.min(this.MAX_RECOVERY_TIME,
        effectiveTime * (1 + (protection.progression.currentStep * 0.1))
      )
    );

    return {
      ...protection.recovery,
      adaptivePeriod,
      progressiveSteps: this.calculateProgressiveSteps(adaptivePeriod, protection.progression.currentStep)
    };
  }

  private calculateProgressiveSteps(totalTime: number, steps: number): number[] {
    const progression = [];
    const baseStep = totalTime / (steps + 1);
    
    for (let i = 1; i <= steps; i++) {
      progression.push(Math.round(baseStep * i * (1 + (i * 0.1))));
    }

    return progression;
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
      },
      inheritance: {
        depth: 1,
        maxDepth: 3,
        complexity: 0.1,
        mergeStrategy: 'shallow'
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
      },
      recovery: {
        baseTime: this.BASE_RECOVERY_TIME,
        energyFactor: 1.0,
        adaptivePeriod: this.BASE_RECOVERY_TIME,
        progressiveSteps: [600000, 1200000, 1800000] // 10, 20, 30 minutes
      },
      progression: {
        currentStep: 0,
        nextThreshold: 0.6,
        decayRate: 0.05,
        growthRate: 0.05
      }
    };

    const protections = this.protection$.value;
    protections.set(id, protection);
    this.protection$.next(protections);

    return id;
  }

  public recordInterruption() {
    this.interruptions$.next(this.interruptions$.value + 1);
    
    // Progressive recovery based on current protection
    const protection = Array.from(this.protection$.value.values())[0];
    if (!protection) return;

    const recoveryTime = protection.recovery.adaptivePeriod;
    const steps = protection.recovery.progressiveSteps;

    // Schedule progressive recovery
    steps.forEach((delay, index) => {
      setTimeout(() => {
        this.interruptions$.next(Math.max(0,
          this.interruptions$.value - (1 / (steps.length - index))
        ));
      }, delay);
    });
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

    while (current && chain.length < current.inheritance.maxDepth) {
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
    inheritance: FlowContext['inheritance'];
    recovery: FlowProtection['recovery'];
    progression: FlowProtection['progression'];
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
      interruptions: this.interruptions$.value,
      inheritance: context.inheritance,
      recovery: protection?.recovery ?? {
        baseTime: this.BASE_RECOVERY_TIME,
        energyFactor: 1.0,
        adaptivePeriod: this.BASE_RECOVERY_TIME,
        progressiveSteps: []
      },
      progression: protection?.progression ?? {
        currentStep: 0,
        nextThreshold: 0.5,
        decayRate: 0.05,
        growthRate: 0.05
      }
    };
  }
} 