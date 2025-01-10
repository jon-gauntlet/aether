import { BehaviorSubject, Observable } from 'rxjs';
import { Field, FlowState } from '../types/base';
import { Energy, EnergyMetrics } from '../energy/types';
import { EnergyPattern, PatternState, PatternContext, PatternMetrics } from './types';

export interface EvolutionState {
  currentGeneration: number;
  patterns: EnergyPattern[];
  fitness: Map<string, number>;
  history: Array<{
    timestamp: number;
    patternId: string;
    changes: Partial<EnergyPattern>;
    success: boolean;
  }>;
}

export class PatternEvolution {
  private state$: BehaviorSubject<EvolutionState>;
  private readonly MUTATION_RATE = 0.1;
  private readonly MIN_FITNESS = 0.3;

  constructor() {
    this.state$ = new BehaviorSubject<EvolutionState>({
      currentGeneration: 0,
      patterns: [],
      fitness: new Map(),
      history: []
    });
  }

  public getState(): Observable<EvolutionState> {
    return this.state$.asObservable();
  }

  public evolvePattern(
    pattern: EnergyPattern,
    context: {
      energyLevels: Energy;
      metrics: EnergyMetrics;
      flowState?: FlowState;
    },
    wasSuccessful: boolean
  ): EnergyPattern {
    const currentState = this.state$.getValue();
    const fitness = this.calculateFitness(pattern, context, wasSuccessful);

    // Update fitness map
    currentState.fitness.set(pattern.id, fitness);

    // Create evolved pattern
    const evolvedPattern = this.mutatePattern(pattern, fitness);

    // Update history
    const historyEntry = {
      timestamp: Date.now(),
      patternId: pattern.id,
      changes: this.getChanges(pattern, evolvedPattern),
      success: wasSuccessful
    };

    // Update state
    this.state$.next({
      ...currentState,
      currentGeneration: currentState.currentGeneration + 1,
      patterns: [
        ...currentState.patterns.filter(p => p.id !== pattern.id),
        evolvedPattern
      ],
      history: [...currentState.history, historyEntry]
    });

    return evolvedPattern;
  }

  public prunePatterns(): void {
    const currentState = this.state$.getValue();
    const survivingPatterns = currentState.patterns.filter(pattern => {
      const fitness = currentState.fitness.get(pattern.id) || 0;
      return fitness >= this.MIN_FITNESS;
    });

    this.state$.next({
      ...currentState,
      patterns: survivingPatterns
    });
  }

  private calculateFitness(
    pattern: EnergyPattern,
    context: {
      energyLevels: Energy;
      metrics: EnergyMetrics;
      flowState?: FlowState;
    },
    wasSuccessful: boolean
  ): number {
    const energyMatch = this.calculateEnergyMatch(pattern.energyLevels, context.energyLevels);
    const metricsMatch = this.calculateMetricsMatch(pattern.metrics, context.metrics);
    const stateMatch = context.flowState === pattern.flowState ? 1 : 0;
    const successBonus = wasSuccessful ? 0.2 : 0;

    return (
      energyMatch * 0.3 +
      metricsMatch * 0.3 +
      stateMatch * 0.2 +
      successBonus
    );
  }

  private calculateEnergyMatch(patternEnergy: Energy, contextEnergy: Energy): number {
    const mentalDiff = Math.abs(patternEnergy.mental - contextEnergy.mental);
    const physicalDiff = Math.abs(patternEnergy.physical - contextEnergy.physical);
    const emotionalDiff = Math.abs(patternEnergy.emotional - contextEnergy.emotional);

    return 1 - (mentalDiff + physicalDiff + emotionalDiff) / 3;
  }

  private calculateMetricsMatch(
    patternMetrics: EnergyMetrics,
    contextMetrics: EnergyMetrics
  ): number {
    const efficiencyDiff = Math.abs(patternMetrics.efficiency - contextMetrics.efficiency);
    const sustainabilityDiff = Math.abs(
      patternMetrics.sustainability - contextMetrics.sustainability
    );
    const recoveryDiff = Math.abs(patternMetrics.recovery - contextMetrics.recovery);

    return 1 - (efficiencyDiff + sustainabilityDiff + recoveryDiff) / 3;
  }

  private mutatePattern(pattern: EnergyPattern, fitness: number): EnergyPattern {
    const mutationStrength = this.MUTATION_RATE * (1 - fitness);

    return {
      ...pattern,
      energyLevels: this.mutateEnergy(pattern.energyLevels, mutationStrength),
      metrics: this.mutateMetrics(pattern.metrics, mutationStrength),
      state: this.determinePatternState(pattern, fitness),
      evolution: {
        version: pattern.evolution.version + 1,
        history: [
          ...pattern.evolution.history,
          {
            timestamp: Date.now(),
            changes: {},
            success: fitness > this.MIN_FITNESS
          }
        ]
      }
    };
  }

  private mutateEnergy(energy: Energy, strength: number): Energy {
    return {
      mental: this.mutateValue(energy.mental, strength),
      physical: this.mutateValue(energy.physical, strength),
      emotional: this.mutateValue(energy.emotional, strength)
    };
  }

  private mutateMetrics(metrics: EnergyMetrics, strength: number): EnergyMetrics {
    return {
      efficiency: this.mutateValue(metrics.efficiency, strength),
      sustainability: this.mutateValue(metrics.sustainability, strength),
      recovery: this.mutateValue(metrics.recovery, strength)
    };
  }

  private mutateValue(value: number, strength: number): number {
    const mutation = (Math.random() - 0.5) * 2 * strength;
    return Math.max(0, Math.min(1, value + mutation));
  }

  private determinePatternState(
    pattern: EnergyPattern,
    fitness: number
  ): PatternState {
    if (pattern.state === PatternState.PROTECTED) {
      return PatternState.PROTECTED;
    }

    if (fitness > 0.8) {
      return PatternState.STABLE;
    }

    if (fitness < this.MIN_FITNESS) {
      return PatternState.EVOLVING;
    }

    return pattern.state;
  }

  private getChanges(
    original: EnergyPattern,
    evolved: EnergyPattern
  ): Partial<EnergyPattern> {
    const changes: Partial<EnergyPattern> = {};

    if (original.state !== evolved.state) {
      changes.state = evolved.state;
    }

    if (JSON.stringify(original.energyLevels) !== JSON.stringify(evolved.energyLevels)) {
      changes.energyLevels = evolved.energyLevels;
    }

    if (JSON.stringify(original.metrics) !== JSON.stringify(evolved.metrics)) {
      changes.metrics = evolved.metrics;
    }

    return changes;
  }
} 