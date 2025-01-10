import { SystemState } from './base';

export type FlowIntensity = 'low' | 'medium' | 'high' | 'peak';

export interface FlowMetrics {
  focus: number;      // 0-1 focus level
  energy: number;     // 0-1 energy level
  clarity: number;    // 0-1 mental clarity
  momentum: number;   // 0-1 progress momentum
}

export interface FlowState {
  active: boolean;
  intensity: FlowIntensity;
  duration: number;   // milliseconds in current state
  metrics: FlowMetrics;
  lastTransition: number;
}

export interface FlowTransition {
  from: FlowIntensity;
  to: FlowIntensity;
  timestamp: number;
  trigger?: string;
}

export interface FlowProtection {
  minFocus: number;
  minEnergy: number;
  recoveryThreshold: number;
  maxDuration: number;
}

export type FlowManager = {
  currentState: FlowState;
  systemState: SystemState;
  protection: FlowProtection;
  history: FlowTransition[];
  
  // Core methods
  startFlow(): Promise<boolean>;
  endFlow(): Promise<void>;
  checkState(): FlowMetrics;
  needsRecovery(): boolean;
}; 