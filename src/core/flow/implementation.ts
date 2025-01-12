import { FlowState, FlowType, FlowTransition, FlowMetrics, isFlowState } from './types';
import { Pattern } from '../pattern/types';

export class FlowSystem {
  private currentState: FlowState;
  private transitions: FlowTransition[];
  private startTime: number;

  constructor(initialPatterns: Pattern[] = []) {
    this.startTime = Date.now();
    this.transitions = [];
    this.currentState = {
      type: 'focus',
      depth: 0.5,
      duration: 0,
      patterns: initialPatterns
    };
  }

  public getCurrentState(): FlowState {
    return {
      ...this.currentState,
      duration: Date.now() - this.startTime
    };
  }

  public transition(to: FlowType, trigger?: string): void {
    const from = this.getCurrentState();
    const newState: FlowState = {
      type: to,
      depth: this.calculateNewDepth(to),
      duration: 0,
      patterns: from.patterns
    };

    if (!isFlowState(newState)) {
      throw new Error('Invalid flow state transition');
    }

    this.transitions.push({
      from,
      to: newState,
      timestamp: Date.now(),
      trigger
    });

    this.startTime = Date.now();
    this.currentState = newState;
  }

  public addPattern(pattern: Pattern): void {
    this.currentState = {
      ...this.currentState,
      patterns: [...this.currentState.patterns, pattern]
    };
  }

  public getMetrics(): FlowMetrics {
    return {
      averageDepth: this.calculateAverageDepth(),
      totalDuration: this.calculateTotalDuration(),
      transitionCount: this.transitions.length,
      recoveryTime: this.calculateRecoveryTime()
    };
  }

  private calculateNewDepth(type: FlowType): number {
    switch (type) {
      case 'deep': return Math.min(this.currentState.depth + 0.2, 1);
      case 'peak': return 1;
      case 'recovery': return Math.max(this.currentState.depth - 0.3, 0);
      default: return this.currentState.depth;
    }
  }

  private calculateAverageDepth(): number {
    if (this.transitions.length === 0) return this.currentState.depth;
    
    const totalDepth = this.transitions.reduce(
      (sum, t) => sum + t.from.depth,
      this.currentState.depth
    );
    
    return totalDepth / (this.transitions.length + 1);
  }

  private calculateTotalDuration(): number {
    const transitionDuration = this.transitions.reduce(
      (sum, t) => sum + t.from.duration,
      0
    );
    return transitionDuration + this.getCurrentState().duration;
  }

  private calculateRecoveryTime(): number {
    const recoveryTransitions = this.transitions.filter(
      t => t.to.type === 'recovery'
    );
    
    return recoveryTransitions.reduce(
      (sum, t) => sum + t.from.duration,
      0
    );
  }
} 