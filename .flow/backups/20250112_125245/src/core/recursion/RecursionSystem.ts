import { BehaviorSubject, Observable } from 'rxjs';
import { FlowState } from '../types/base';
import { ConsciousnessState } from '../types/consciousness';
import { Energy } from '../energy/types';
import { PatternState } from '../pattern/types';

export interface RecursionMetrics {
  depth: number;
  complexity: number;
  stability: number;
  efficiency: number;
  coherence: number;
}

export interface RecursionNode {
  id: string;
  parentId: string | null;
  children: string[];
  state: {
    flowState: FlowState;
    patternState: PatternState;
    energy: Energy;
  };
  metrics: RecursionMetrics;
  timestamp: Date;
}

export interface RecursionState {
  nodes: RecursionNode[];
  activeNode: string | null;
  maxDepth: number;
  metrics: RecursionMetrics;
  isStable: boolean;
}

export class RecursionSystem {
  private state$: BehaviorSubject<RecursionState>;
  private readonly MAX_NODES = 100;
  private readonly MAX_DEPTH = 7;
  private readonly STABILITY_THRESHOLD = 0.7;

  constructor() {
    this.state$ = new BehaviorSubject<RecursionState>({
      nodes: [],
      activeNode: null,
      maxDepth: 0,
      metrics: {
        depth: 1.0,
        complexity: 1.0,
        stability: 1.0,
        efficiency: 1.0,
        coherence: 1.0
      },
      isStable: true
    });
  }

  public getState(): Observable<RecursionState> {
    return this.state$.asObservable();
  }

  public createNode(
    parentId: string | null,
    state: {
      flowState: FlowState;
      patternState: PatternState;
      energy: Energy;
    }
  ): string | null {
    const currentState = this.state$.getValue();
    
    if (currentState.nodes.length >= this.MAX_NODES) return null;
    if (parentId && this.getNodeDepth(parentId) >= this.MAX_DEPTH) return null;

    const node: RecursionNode = {
      id: this.generateId(),
      parentId,
      children: [],
      state,
      metrics: {
        depth: 1.0,
        complexity: 1.0,
        stability: 1.0,
        efficiency: 1.0,
        coherence: 1.0
      },
      timestamp: new Date()
    };

    let updatedNodes = [...currentState.nodes, node];
    if (parentId) {
      updatedNodes = updatedNodes.map(n =>
        n.id === parentId
          ? { ...n, children: [...n.children, node.id] }
          : n
      );
    }

    const metrics = this.calculateSystemMetrics(updatedNodes);
    const maxDepth = this.calculateMaxDepth(updatedNodes);

    this.state$.next({
      ...currentState,
      nodes: updatedNodes,
      maxDepth,
      metrics,
      isStable: this.checkStability(metrics)
    });

    return node.id;
  }

  public activateNode(nodeId: string): void {
    const currentState = this.state$.getValue();
    const node = currentState.nodes.find(n => n.id === nodeId);
    if (!node) return;

    this.state$.next({
      ...currentState,
      activeNode: nodeId
    });
  }

  public updateNodeState(
    nodeId: string,
    state: Partial<{
      flowState: FlowState;
      patternState: PatternState;
      energy: Energy;
    }>
  ): void {
    const currentState = this.state$.getValue();
    const node = currentState.nodes.find(n => n.id === nodeId);
    if (!node) return;

    const updatedNodes = currentState.nodes.map(n =>
      n.id === nodeId
        ? {
            ...n,
            state: { ...n.state, ...state },
            metrics: this.calculateNodeMetrics(n, state)
          }
        : n
    );

    const metrics = this.calculateSystemMetrics(updatedNodes);

    this.state$.next({
      ...currentState,
      nodes: updatedNodes,
      metrics,
      isStable: this.checkStability(metrics)
    });
  }

  public handleFlowTransition(
    newState: FlowState,
    consciousness: ConsciousnessState
  ): void {
    const currentState = this.state$.getValue();
    if (!currentState.activeNode) return;

    const activeNode = currentState.nodes.find(
      n => n.id === currentState.activeNode
    );
    if (!activeNode) return;

    this.updateNodeState(activeNode.id, {
      flowState: newState,
      energy: consciousness.energy
    });

    // Propagate changes to children
    this.propagateStateChanges(
      activeNode.id,
      newState,
      consciousness
    );
  }

  public synchronize(consciousness: ConsciousnessState): void {
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

  private propagateStateChanges(
    nodeId: string,
    flowState: FlowState,
    consciousness: ConsciousnessState
  ): void {
    const currentState = this.state$.getValue();
    const node = currentState.nodes.find(n => n.id === nodeId);
    if (!node) return;

    // Update children recursively
    node.children.forEach(childId => {
      const childNode = currentState.nodes.find(n => n.id === childId);
      if (!childNode) return;

      const energyImpact = this.calculateEnergyImpact(
        flowState,
        consciousness,
        this.getNodeDepth(childId)
      );

      this.updateNodeState(childId, {
        flowState,
        energy: {
          mental: Math.max(0, Math.min(1, childNode.state.energy.mental + energyImpact)),
          physical: Math.max(0, Math.min(1, childNode.state.energy.physical + energyImpact)),
          emotional: Math.max(0, Math.min(1, childNode.state.energy.emotional + energyImpact))
        }
      });

      this.propagateStateChanges(childId, flowState, consciousness);
    });
  }

  private calculateNodeMetrics(
    node: RecursionNode,
    stateUpdate: Partial<{
      flowState: FlowState;
      patternState: PatternState;
      energy: Energy;
    }>
  ): RecursionMetrics {
    const updatedState = { ...node.state, ...stateUpdate };
    const avgEnergy = (
      updatedState.energy.mental +
      updatedState.energy.physical +
      updatedState.energy.emotional
    ) / 3;

    const depth = this.getNodeDepth(node.id);
    const depthFactor = Math.max(0.5, 1 - depth / this.MAX_DEPTH);

    return {
      depth: depthFactor,
      complexity: Math.min(1, depth * 0.2 + avgEnergy * 0.8),
      stability: avgEnergy * depthFactor,
      efficiency: Math.min(1, (1 - depth / this.MAX_DEPTH) * avgEnergy),
      coherence: Math.min(1, avgEnergy * depthFactor)
    };
  }

  private calculateSystemMetrics(
    nodes: RecursionNode[],
    consciousness?: ConsciousnessState
  ): RecursionMetrics {
    if (nodes.length === 0) {
      return {
        depth: 1.0,
        complexity: 1.0,
        stability: 1.0,
        efficiency: 1.0,
        coherence: consciousness?.metrics.coherence || 1.0
      };
    }

    const avgMetrics = nodes.reduce(
      (sum, node) => ({
        depth: sum.depth + node.metrics.depth,
        complexity: sum.complexity + node.metrics.complexity,
        stability: sum.stability + node.metrics.stability,
        efficiency: sum.efficiency + node.metrics.efficiency,
        coherence: sum.coherence + node.metrics.coherence
      }),
      {
        depth: 0,
        complexity: 0,
        stability: 0,
        efficiency: 0,
        coherence: 0
      }
    );

    return {
      depth: Math.min(1, avgMetrics.depth / nodes.length),
      complexity: Math.min(1, avgMetrics.complexity / nodes.length),
      stability: Math.min(1, avgMetrics.stability / nodes.length),
      efficiency: Math.min(1, avgMetrics.efficiency / nodes.length),
      coherence: Math.min(1, avgMetrics.coherence / nodes.length)
    };
  }

  private calculateEnergyImpact(
    flowState: FlowState,
    consciousness: ConsciousnessState,
    depth: number
  ): number {
    const baseImpact = -0.05;
    const depthFactor = Math.max(0.3, 1 - depth / this.MAX_DEPTH);
    const stabilityFactor = consciousness.flowSpace.stability > 0.7 ? 1.2 : 0.8;

    switch (flowState) {
      case FlowState.FLOW:
        return baseImpact * 0.5 * depthFactor * stabilityFactor;
      case FlowState.RECOVERING:
        return Math.abs(baseImpact) * 0.3 * depthFactor;
      case FlowState.TRANSITIONING:
        return baseImpact * 0.8 * depthFactor * stabilityFactor;
      default:
        return baseImpact * depthFactor;
    }
  }

  private getNodeDepth(nodeId: string): number {
    const node = this.state$.getValue().nodes.find(n => n.id === nodeId);
    if (!node) return 0;
    if (!node.parentId) return 0;
    return 1 + this.getNodeDepth(node.parentId);
  }

  private calculateMaxDepth(nodes: RecursionNode[]): number {
    return Math.max(...nodes.map(node => this.getNodeDepth(node.id)));
  }

  private checkStability(metrics: RecursionMetrics): boolean {
    const stabilityScore = (
      metrics.depth * 0.2 +
      metrics.stability * 0.3 +
      metrics.efficiency * 0.2 +
      metrics.coherence * 0.3
    );

    return stabilityScore >= this.STABILITY_THRESHOLD;
  }

  private generateId(): string {
    return `recursion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
} 