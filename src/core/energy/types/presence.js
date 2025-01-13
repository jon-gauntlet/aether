/**
 * Core Type Order
 *
 * This file establishes the foundational type hierarchy.
 */

// Core measures
export type Presence = number;  // [0,1]
export type Harmony = number;   // [0,1]
export type Energy = number;    // [0,1]
export type Depth = number;     // [0,1]

// Flow types
export type FlowType =
  | 'meditation'
  | 'focus'
  | 'flow';

export type ConnectionType =
  | 'flow'
  | 'presence'
  | 'resonance';

export type ConsciousnessType =
  | 'individual'
  | 'collective';

export type SpaceType =
  | 'thought'
  | 'feeling'
  | 'intuition';

export type PatternType = 'energy' | 'flow' | 'autonomic' | 'consciousness';

export type EnergyFlowType = 'vital' | 'purifying' | 'peaceful' | 'still' | 'protective' | 'transformative';

// Validation functions
export const isValidMeasure = (value: unknown): value is number => {
  if (typeof value !== 'number' || isNaN(value)) return false;
  return value >= 0 && value <= 1;
};

// Type guards
export const isFlowType = (type: unknown): type is FlowType =>
  typeof type === 'string' && ['meditation', 'focus', 'flow'].includes(type);

export const isConnectionType = (type: unknown): type is ConnectionType =>
  typeof type === 'string' && ['flow', 'presence', 'resonance'].includes(type);

export const isConsciousnessType = (type: unknown): type is ConsciousnessType =>
  typeof type === 'string' && ['individual', 'collective'].includes(type);

export const isSpaceType = (type: unknown): type is SpaceType =>
  typeof type === 'string' && ['thought', 'feeling', 'intuition'].includes(type);