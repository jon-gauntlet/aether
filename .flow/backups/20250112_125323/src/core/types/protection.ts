import { SystemState, FlowState } from './base';
import { SpaceType } from './space';

export interface ProtectionMetrics {
  stability: number;    // 0-1 system stability
  resilience: number;   // 0-1 recovery capability
  integrity: number;    // 0-1 state preservation
  immunity: number;     // 0-1 disruption resistance
}

export interface ProtectionState {
  active: boolean;
  metrics: ProtectionMetrics;
  lastCheck: number;
  violations: number;
}

export interface RecoveryPlan {
  type: 'quick' | 'full';
  duration: number;
  targetMetrics: Partial<ProtectionMetrics>;
  spaceRequirements?: SpaceType[];
}

export interface ProtectionViolation {
  timestamp: number;
  type: 'flow' | 'space' | 'system';
  severity: number;
  context: any;
}

export type ProtectionGuard = {
  state: ProtectionState;
  systemState: SystemState;
  flowState: FlowState;
  
  // Core methods
  checkHealth(): ProtectionMetrics;
  needsRecovery(): boolean;
  startRecovery(): Promise<RecoveryPlan>;
  handleViolation(violation: ProtectionViolation): void;
}; 