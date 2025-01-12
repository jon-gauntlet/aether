import { FlowMetrics, Field } from '../base';

export interface Space {
  quiet: boolean;
  ready: boolean;
  flowing: boolean;
}

export interface FlowPattern {
  id: string;
  type: FlowType;
  metrics: FlowMetrics;
  field?: Field;
  timestamp: number;
}

export enum FlowType {
  NATURAL = 'NATURAL',
  PROTECTED = 'PROTECTED',
  ENHANCED = 'ENHANCED',
  AUTONOMOUS = 'AUTONOMOUS'
}

export interface FlowContext {
  type?: string;
  depth?: number;
  field?: Field;
  metrics?: FlowMetrics;
}

export class FlowSpace {
  private state: Space = {
    quiet: true,
    ready: true,
    flowing: false
  };

  private patterns: FlowPattern[] = [];

  watch() {
    return {
      subscribe: (callback: (data: { state: Space; flows: FlowPattern[] }) => void) => {
        callback({ state: this.state, flows: this.patterns });
        return {
          unsubscribe: () => {}
        };
      }
    };
  }

  async join(type: FlowType, context: FlowContext = {}) {
    const pattern: FlowPattern = {
      id: Math.random().toString(),
      type,
      metrics: {
        intensity: 0,
        coherence: 0,
        resonance: 0,
        presence: 0,
        harmony: 0,
        rhythm: 0,
        depth: context.depth || 0,
        clarity: 0,
        stability: 0,
        focus: 0,
        energy: 0,
        quality: 0
      },
      field: context.field,
      timestamp: Date.now()
    };
    this.patterns.push(pattern);
    return pattern;
  }

  async part(id: string) {
    this.patterns = this.patterns.filter(p => p.id !== id);
  }
} 