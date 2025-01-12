import { BehaviorSubject, Observable } from 'rxjs';
import { FlowState } from '../types/base';
import { ConsciousnessState } from '../types/consciousness';
import { Energy } from '../energy/types';
import { PatternState, EnergyPattern } from '../pattern/types';

export interface EvolutionMetrics {
  adaptability: number;
  resilience: number;
  innovation: number;
  stability: number;
  fitness: number;
}

export interface EvolutionNode {
  id: string;
  pattern: EnergyPattern;
  generation: number;
  fitness: number;
  metrics: EvolutionMetrics;
  mutations: Array<{
    timestamp: Date;
    type: string;
    impact: number;
    success: boolean;
  }>;
}

export interface EvolutionState {
  nodes: EvolutionNode[];
  currentGeneration: number;
  metrics: EvolutionMetrics;
  history: Array<{
    timestamp: Date;
    generation: number;
    metrics: EvolutionMetrics;
    topFitness: number;
  }>;
  isStable: boolean;
}

export class EvolutionSystem {
  private state$: BehaviorSubject<EvolutionState>;
  private readonly MAX_NODES = 100;
  private readonly MAX_HISTORY = 1000;
  private readonly STABILITY_THRESHOLD = 0.7;
  private readonly MUTATION_RATE = 0.1;

  constructor() {
    this.state$ = new BehaviorSubject<EvolutionState>({
      nodes: [],
      currentGeneration: 0,
      metrics: {
        adaptability: 1.0,
        resilience: 1.0,
        innovation: 1.0,
        stability: 1.0,
        fitness: 1.0
      },
      history: [],
      isStable: true
    });
  }

  public getState(): Observable<EvolutionState> {
    return this.state$.asObservable();
  }

  public evolvePattern(
    pattern: EnergyPattern,
    consciousness: ConsciousnessState
  ): EnergyPattern {
    const currentState = this.state$.getValue();
    const node = this.createEvolutionNode(pattern, currentState.currentGeneration);
    
    const mutatedNode = this.mutateNode(
      node,
      consciousness,
      this.calculateMutationStrength(node, consciousness)
    );

    const updatedNodes = this.updateNodeCollection(
      currentState.nodes,
      mutatedNode
    );

    const metrics = this.calculateSystemMetrics(updatedNodes);
    const history = this.updateHistory(currentState.history, {
      timestamp: new Date(),
      generation: currentState.currentGeneration,
      metrics,
      topFitness: this.getTopFitness(updatedNodes)
    });

    this.state$.next({
      ...currentState,
      nodes: updatedNodes,
      currentGeneration: currentState.currentGeneration + 1,
      metrics,
      history,
      isStable: this.checkStability(metrics)
    });

    return this.convertNodeToPattern(mutatedNode);
  }

  public handleFlowTransition(
    newState: FlowState,
    consciousness: ConsciousnessState
  ): void {
    const currentState = this.state$.getValue();
    const metrics = this.calculateSystemMetrics(
      currentState.nodes,
      consciousness
    );

    this.state$.next({
      ...currentState,
      metrics,
      isStable: this.checkStability(metrics)
    });
  }

  public synchronize(consciousness: ConsciousnessState): void {
    const currentState = this.state$.getValue();
    
    // Update all nodes based on consciousness state
    const updatedNodes = currentState.nodes.map(node =>
      this.updateNodeFitness(node, consciousness)
    );

    const metrics = this.calculateSystemMetrics(updatedNodes, consciousness);

    this.state$.next({
      ...currentState,
      nodes: updatedNodes,
      metrics,
      isStable: this.checkStability(metrics)
    });
  }

  private createEvolutionNode(
    pattern: EnergyPattern,
    generation: number
  ): EvolutionNode {
    return {
      id: this.generateId(),
      pattern,
      generation,
      fitness: this.calculateInitialFitness(pattern),
      metrics: {
        adaptability: pattern.metrics.adaptability,
        resilience: pattern.metrics.stability,
        innovation: 1.0,
        stability: pattern.metrics.stability,
        fitness: pattern.metrics.efficiency
      },
      mutations: []
    };
  }

  private mutateNode(
    node: EvolutionNode,
    consciousness: ConsciousnessState,
    mutationStrength: number
  ): EvolutionNode {
    const mutations = this.generateMutations(
      node,
      consciousness,
      mutationStrength
    );

    const mutatedPattern = this.applyMutations(
      node.pattern,
      mutations,
      consciousness
    );

    return {
      ...node,
      pattern: mutatedPattern,
      fitness: this.calculateFitness(mutatedPattern, consciousness),
      metrics: this.calculateNodeMetrics(mutatedPattern, mutations),
      mutations: [...node.mutations, ...mutations]
    };
  }

  private generateMutations(
    node: EvolutionNode,
    consciousness: ConsciousnessState,
    strength: number
  ): Array<{
    timestamp: Date;
    type: string;
    impact: number;
    success: boolean;
  }> {
    const mutations: Array<{
      timestamp: Date;
      type: string;
      impact: number;
      success: boolean;
    }> = [];

    if (Math.random() < this.MUTATION_RATE * strength) {
      mutations.push({
        timestamp: new Date(),
        type: 'ENERGY_LEVELS',
        impact: strength * consciousness.flowSpace.stability,
        success: consciousness.metrics.coherence > 0.7
      });
    }

    if (Math.random() < this.MUTATION_RATE * strength) {
      mutations.push({
        timestamp: new Date(),
        type: 'METRICS',
        impact: strength * consciousness.metrics.depth,
        success: consciousness.metrics.clarity > 0.7
      });
    }

    return mutations;
  }

  private applyMutations(
    pattern: EnergyPattern,
    mutations: Array<{
      timestamp: Date;
      type: string;
      impact: number;
      success: boolean;
    }>,
    consciousness: ConsciousnessState
  ): EnergyPattern {
    let mutatedPattern = { ...pattern };

    mutations.forEach(mutation => {
      switch (mutation.type) {
        case 'ENERGY_LEVELS':
          mutatedPattern = {
            ...mutatedPattern,
            energyLevels: this.mutateEnergy(
              pattern.energyLevels,
              mutation.impact,
              consciousness
            )
          };
          break;
        case 'METRICS':
          mutatedPattern = {
            ...mutatedPattern,
            metrics: this.mutateMetrics(
              pattern.metrics,
              mutation.impact,
              consciousness
            )
          };
          break;
      }
    });

    return {
      ...mutatedPattern,
      evolution: {
        version: pattern.evolution.version + 1,
        history: [
          ...pattern.evolution.history,
          {
            timestamp: new Date(),
            changes: mutations,
            success: mutations.every(m => m.success)
          }
        ]
      }
    };
  }

  private mutateEnergy(
    energy: Energy,
    impact: number,
    consciousness: ConsciousnessState
  ): Energy {
    const stabilityFactor = consciousness.flowSpace.stability;
    const mutationFactor = impact * stabilityFactor;

    return {
      mental: Math.max(0, Math.min(1,
        energy.mental + (Math.random() - 0.5) * mutationFactor
      )),
      physical: Math.max(0, Math.min(1,
        energy.physical + (Math.random() - 0.5) * mutationFactor
      )),
      emotional: Math.max(0, Math.min(1,
        energy.emotional + (Math.random() - 0.5) * mutationFactor
      ))
    };
  }

  private mutateMetrics(
    metrics: any,
    impact: number,
    consciousness: ConsciousnessState
  ): any {
    const coherenceFactor = consciousness.metrics.coherence;
    const mutationFactor = impact * coherenceFactor;

    return Object.entries(metrics).reduce((acc, [key, value]) => ({
      ...acc,
      [key]: Math.max(0, Math.min(1,
        Number(value) + (Math.random() - 0.5) * mutationFactor
      ))
    }), {});
  }

  private calculateMutationStrength(
    node: EvolutionNode,
    consciousness: ConsciousnessState
  ): number {
    const generationFactor = Math.max(0.3,
      1 - node.generation / (this.MAX_NODES / 2)
    );
    const fitnessFactor = 1 - node.fitness;
    const stabilityFactor = consciousness.flowSpace.stability;

    return Math.min(1,
      generationFactor * 0.4 +
      fitnessFactor * 0.4 +
      stabilityFactor * 0.2
    );
  }

  private calculateInitialFitness(pattern: EnergyPattern): number {
    const energyFitness = (
      pattern.energyLevels.mental +
      pattern.energyLevels.physical +
      pattern.energyLevels.emotional
    ) / 3;

    const metricsFitness = (
      pattern.metrics.efficiency +
      pattern.metrics.sustainability +
      pattern.metrics.stability
    ) / 3;

    return (energyFitness * 0.5 + metricsFitness * 0.5);
  }

  private calculateFitness(
    pattern: EnergyPattern,
    consciousness: ConsciousnessState
  ): number {
    const energyFitness = (
      pattern.energyLevels.mental +
      pattern.energyLevels.physical +
      pattern.energyLevels.emotional
    ) / 3;

    const metricsFitness = (
      pattern.metrics.efficiency +
      pattern.metrics.sustainability +
      pattern.metrics.stability
    ) / 3;

    const consciousnessFitness = (
      consciousness.metrics.coherence +
      consciousness.metrics.depth +
      consciousness.metrics.flexibility
    ) / 3;

    return (
      energyFitness * 0.4 +
      metricsFitness * 0.4 +
      consciousnessFitness * 0.2
    );
  }

  private calculateNodeMetrics(
    pattern: EnergyPattern,
    mutations: Array<{
      timestamp: Date;
      type: string;
      impact: number;
      success: boolean;
    }>
  ): EvolutionMetrics {
    const successRate = mutations.length > 0
      ? mutations.filter(m => m.success).length / mutations.length
      : 1;

    const avgImpact = mutations.length > 0
      ? mutations.reduce((sum, m) => sum + m.impact, 0) / mutations.length
      : 0;

    return {
      adaptability: pattern.metrics.adaptability * successRate,
      resilience: pattern.metrics.stability * (1 - avgImpact),
      innovation: avgImpact,
      stability: pattern.metrics.stability * successRate,
      fitness: pattern.metrics.efficiency * successRate
    };
  }

  private calculateSystemMetrics(
    nodes: EvolutionNode[],
    consciousness?: ConsciousnessState
  ): EvolutionMetrics {
    if (nodes.length === 0) {
      return {
        adaptability: 1.0,
        resilience: 1.0,
        innovation: 1.0,
        stability: 1.0,
        fitness: 1.0
      };
    }

    const avgMetrics = nodes.reduce(
      (sum, node) => ({
        adaptability: sum.adaptability + node.metrics.adaptability,
        resilience: sum.resilience + node.metrics.resilience,
        innovation: sum.innovation + node.metrics.innovation,
        stability: sum.stability + node.metrics.stability,
        fitness: sum.fitness + node.metrics.fitness
      }),
      {
        adaptability: 0,
        resilience: 0,
        innovation: 0,
        stability: 0,
        fitness: 0
      }
    );

    const baseMetrics = {
      adaptability: avgMetrics.adaptability / nodes.length,
      resilience: avgMetrics.resilience / nodes.length,
      innovation: avgMetrics.innovation / nodes.length,
      stability: avgMetrics.stability / nodes.length,
      fitness: avgMetrics.fitness / nodes.length
    };

    if (consciousness) {
      return {
        ...baseMetrics,
        stability: (
          baseMetrics.stability * 0.7 +
          consciousness.flowSpace.stability * 0.3
        )
      };
    }

    return baseMetrics;
  }

  private updateNodeCollection(
    nodes: EvolutionNode[],
    newNode: EvolutionNode
  ): EvolutionNode[] {
    const updatedNodes = [...nodes, newNode];
    if (updatedNodes.length > this.MAX_NODES) {
      return updatedNodes
        .sort((a, b) => b.fitness - a.fitness)
        .slice(0, this.MAX_NODES);
    }
    return updatedNodes;
  }

  private updateHistory(
    history: Array<{
      timestamp: Date;
      generation: number;
      metrics: EvolutionMetrics;
      topFitness: number;
    }>,
    entry: {
      timestamp: Date;
      generation: number;
      metrics: EvolutionMetrics;
      topFitness: number;
    }
  ): Array<{
    timestamp: Date;
    generation: number;
    metrics: EvolutionMetrics;
    topFitness: number;
  }> {
    const updatedHistory = [...history, entry];
    if (updatedHistory.length > this.MAX_HISTORY) {
      return updatedHistory.slice(-this.MAX_HISTORY);
    }
    return updatedHistory;
  }

  private updateNodeFitness(
    node: EvolutionNode,
    consciousness: ConsciousnessState
  ): EvolutionNode {
    return {
      ...node,
      fitness: this.calculateFitness(node.pattern, consciousness)
    };
  }

  private getTopFitness(nodes: EvolutionNode[]): number {
    if (nodes.length === 0) return 0;
    return Math.max(...nodes.map(n => n.fitness));
  }

  private checkStability(metrics: EvolutionMetrics): boolean {
    const stabilityScore = (
      metrics.adaptability * 0.3 +
      metrics.resilience * 0.2 +
      metrics.stability * 0.3 +
      metrics.fitness * 0.2
    );

    return stabilityScore >= this.STABILITY_THRESHOLD;
  }

  private convertNodeToPattern(node: EvolutionNode): EnergyPattern {
    return node.pattern;
  }

  private generateId(): string {
    return `evolution_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
} 