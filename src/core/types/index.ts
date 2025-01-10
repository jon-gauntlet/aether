// Re-export core types with explicit naming to avoid conflicts
export type { 
  SystemState,
  SystemMetrics,
  ISystemComponent,
  IFlowManager,
  IProtectionManager,
  FieldConfig,
  Field,
  DeepPartial,
  SystemConfig
} from './base';

// Export value
export { createDefaultField } from './base';

// Export domain-specific types
export type {
  SpaceType,
  SpaceConfig,
  Space,
  SpaceTransition,
  SpaceNavigation
} from './space';

export type {
  FlowIntensity,
  FlowMetrics,
  FlowState,
  FlowTransition,
  FlowProtection,
  FlowManager
} from './flow';

export type {
  ProtectionMetrics,
  ProtectionState,
  RecoveryPlan,
  ProtectionViolation,
  ProtectionGuard
} from './protection';

// Type utilities
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncResult<T> = Promise<T>;

// System-wide type constants
export const SYSTEM_VERSION = '1.0.0';
export const MIN_HEALTH_THRESHOLD = 0.4;
export const MIN_FOCUS_THRESHOLD = 0.6;
export const MAX_FLOW_DURATION = 3 * 60 * 60 * 1000; // 3 hours

// Type guards
export const isValidHealth = (value: number): boolean => 
  value >= 0 && value <= 1;

export const isValidState = (state: any): boolean =>
  state && typeof state === 'object' && 
  'health' in state && isValidHealth(state.health); 