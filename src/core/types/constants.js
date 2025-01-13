/**
 * Constants for Flow States
 */
export const FLOW_STATES = {
  FLOW: 'FLOW' as const,
  FOCUS: 'FOCUS' as const,
  RECOVERY: 'RECOVERY' as const,
  HYPERFOCUS: 'HYPERFOCUS' as const
} as const;

/**
 * Constants for Action Types
 */
export const ACTION_TYPES = {
  ENHANCE_FLOW: 'ENHANCE_FLOW' as const,
  FORCE_TRANSITION: 'FORCE_TRANSITION' as const,
  MODIFY_FIELD: 'MODIFY_FIELD' as const,
  INITIATE_RECOVERY: 'INITIATE_RECOVERY' as const
} as const;

/**
 * Type utilities for constants
 */
export type FlowState = typeof FLOW_STATES[keyof typeof FLOW_STATES];
export type ActionType = typeof ACTION_TYPES[keyof typeof ACTION_TYPES];

/**
 * Validation utilities
 */
export const isFlowState = (value: unknown): value is FlowState =>
  typeof value === 'string' && Object.values(FLOW_STATES).includes(value as FlowState);

export const isActionType = (value: unknown): value is ActionType =>
  typeof value === 'string' && Object.values(ACTION_TYPES).includes(value as ActionType); 