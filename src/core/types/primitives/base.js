export enum FlowState {
  FOCUSED = 'FOCUSED',
  HYPERFOCUSED = 'HYPERFOCUSED',
  DISTRACTED = 'DISTRACTED',
  RECOVERY = 'RECOVERY'
}

export enum ProtectionLevel {
  MAXIMUM = 'MAXIMUM',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export interface ValidationResult {
  isValid: boolean;
  flowState: FlowState;
  protectionLevel: ProtectionLevel;
}

export type BaseType = any;
export type EnergyMetrics = any;
export type Pattern = any;
export let EnergyMetricsSchema: any;
export let PatternSchema: any; 