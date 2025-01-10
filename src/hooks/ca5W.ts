import { BehaviorSubject } from 'rxjs';
import {
  AutonomicFlow,
  AutonomicState,
  AutonomicSystem as IAutonomicSystem,
  Context,
  Energy,
  Pattern,
  PatternManager
} from '../types/autonomic';

export class AutonomicSystem implements IAutonomicSystem {
  private state$ = new BehaviorSubject<AutonomicState>({
    context: {
      current: '',
      depth: 0,
      patterns: []
    },
    energy: {
      level: 1,
      type: 'steady',
      flow: 'natural'
    },
    protection: {
      depth: 0,
      patterns: [],
      states: []
    }
  });

  private flow$ = new BehaviorSubject<AutonomicFlow>({
    context: {
      current: '',
      depth: 0,
      patterns: []
    },
    energy: {
      level: 1,
      type: 'steady',
      flow: 'natural'
    },
    protection: {
      depth: 0,
      patterns: [],
      states: []
    }
  });

  constructor(public patterns: PatternManager) {
    // Subscribe to pattern manager updates
    this.patterns.subscribe(({ current }) => {
      if (current) {
        this.updateFlow({
          context: {
            current: current.context.join(','),
            depth: current.protection,
            patterns: current.context
          },
          energy: {
            level: current.energy,
            type: this.determineEnergyType(current),
            flow: current.flow
          },
          protection: {
            depth: current.protection,
            patterns: [current.id],
            states: current.states
          }
        });
      }
    });

    // Subscribe to flow updates
    this.flow$.subscribe(flow => {
      this.state$.next({
        context: { ...flow.context },
        energy: { ...flow.energy },
        protection: { ...flow.protection }
      });
    });
  }

  get state(): AutonomicState {
    return this.state$.value;
  }

  updateFlow(flow: Partial<AutonomicFlow>): void {
    this.flow$.next({
      context: {
        ...this.flow$.value.context,
        ...(flow.context || {})
      },
      energy: {
        ...this.flow$.value.energy,
        ...(flow.energy || {})
      },
      protection: {
        ...this.flow$.value.protection,
        ...(flow.protection || {})
      }
    });
  }

  protect(pattern: string): void {
    const currentProtection = this.state.protection;
    if (!currentProtection.patterns.includes(pattern)) {
      this.updateFlow({
        protection: {
          ...currentProtection,
          patterns: [...currentProtection.patterns, pattern],
          depth: Math.min(1, currentProtection.depth + 0.1)
        }
      });
    }
  }

  unprotect(pattern: string): void {
    const currentProtection = this.state.protection;
    if (currentProtection.patterns.includes(pattern)) {
      this.updateFlow({
        protection: {
          ...currentProtection,
          patterns: currentProtection.patterns.filter(p => p !== pattern),
          depth: Math.max(0, currentProtection.depth - 0.1)
        }
      });
    }
  }

  setEnergy(energy: Partial<Energy>): void {
    this.updateFlow({
      energy: {
        ...this.state.energy,
        ...energy
      }
    });
  }

  setContext(context: Partial<Context>): void {
    this.updateFlow({
      context: {
        ...this.state.context,
        ...context
      }
    });
  }

  subscribe(callback: (state: AutonomicState) => void) {
    return this.state$.subscribe(callback);
  }

  // Pattern Analysis Methods
  private determineEnergyType(pattern: Pattern): 'deep' | 'steady' | 'reflective' | 'analytical' {
    const { energy, metadata } = pattern;
    const successRate = metadata.success / metadata.uses;

    if (energy > 0.8 && successRate > 0.8) {
      return 'deep';
    }
    if (energy > 0.6 && successRate > 0.6) {
      return 'steady';
    }
    if (energy > 0.4 && successRate > 0.4) {
      return 'reflective';
    }
    return 'analytical';
  }

  // System Analysis Methods
  analyzeState(): {
    contextDepth: number;
    energyLevel: number;
    protectionLevel: number;
    flowQuality: number;
  } {
    const state = this.state$.value;
    const contextDepth = state.context.depth;
    const energyLevel = state.energy.level;
    const protectionLevel = state.protection.depth;
    const flowQuality = this.calculateFlowQuality(state);

    return {
      contextDepth,
      energyLevel,
      protectionLevel,
      flowQuality
    };
  }

  private calculateFlowQuality(state: AutonomicState): number {
    const { energy, protection, context } = state;
    
    // Weight factors
    const energyWeight = 0.4;
    const protectionWeight = 0.3;
    const contextWeight = 0.3;

    // Calculate component scores
    const energyScore = energy.level;
    const protectionScore = protection.depth;
    const contextScore = context.depth;

    // Calculate weighted average
    return (
      energyScore * energyWeight +
      protectionScore * protectionWeight +
      contextScore * contextWeight
    );
  }

  // System Evolution Methods
  evolveSystem(): void {
    const current = this.patterns.current;
    if (current) {
      // Evolve current pattern
      this.patterns.evolveCurrentPattern();

      // Find and suggest next patterns
      const suggestions = this.patterns.suggestNext(current);
      if (suggestions.length > 0) {
        const nextPattern = suggestions[0];
        this.patterns.transitionTo(nextPattern);
      }
    }
  }

  // System Protection Methods
  protectSystem(): void {
    const current = this.patterns.current;
    if (current) {
      // Protect current pattern
      this.patterns.protectCurrentPattern();

      // Update system protection
      this.protect(current.id);
    }
  }
} 