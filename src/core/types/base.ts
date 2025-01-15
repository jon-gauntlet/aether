// Base types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

export interface BaseState {
  type: string;
  metrics: FlowMetrics | Record<string, number>;
}

export interface FlowState extends BaseState {
  type: 'flow';
  metrics: FlowMetrics;
}

export interface FlowMetrics {
  stability: number;
  coherence: number;
  resonance: number;
  quality: number;
  energy: number;
  focus: number;
  [key: string]: number;
}

export interface Protection {
  level: number;
  active: boolean;
  threshold: number;
}

export interface Resonance {
  strength: number;
  frequency: number;
}

export interface NaturalPattern {
  type: string;
  strength: number;
  energy: number;
}

export interface SystemUpdate {
  timestamp: number;
  changes: Record<string, any>;
}

// Type guards
export const isFlowMetrics = (metrics: any): metrics is FlowMetrics => {
  return (
    typeof metrics === 'object' &&
    typeof metrics.stability === 'number' &&
    typeof metrics.coherence === 'number' &&
    typeof metrics.resonance === 'number' &&
    typeof metrics.quality === 'number' &&
    typeof metrics.energy === 'number' &&
    typeof metrics.focus === 'number'
  );
};

export const isProtection = (protection: any): protection is Protection => {
  return (
    typeof protection === 'object' &&
    typeof protection.level === 'number' &&
    typeof protection.active === 'boolean' &&
    typeof protection.threshold === 'number'
  );
};

export const isNaturalPattern = (pattern: any): pattern is NaturalPattern => {
  return (
    typeof pattern === 'object' &&
    typeof pattern.type === 'string' &&
    typeof pattern.strength === 'number' &&
    typeof pattern.energy === 'number'
  );
};

export const isFlowTransition = (transition: any): boolean => {
  return (
    typeof transition === 'object' &&
    typeof transition.from === 'string' &&
    typeof transition.to === 'string' &&
    typeof transition.reason === 'string' &&
    typeof transition.timestamp === 'number'
  );
}; 