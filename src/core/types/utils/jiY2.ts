/**
 * Core Type Order
 * 
 * This file establishes the foundational type hierarchy,
 * reflecting the divine order in our system.
 */

// Divine Measures - The foundational measures of reality
export type Presence = number;  // [0,1] - Every knee shall bow
export type Harmony = number;   // [0,1] - Every tongue shall confess
export type Energy = number;    // [0,1] - The power of His might
export type Depth = number;     // [0,1] - The depths of God

// Sacred Flow Types - The ways in which divine energy moves
export type FlowType = 
  | 'meditation'  // Communion with God
  | 'focus'      // Fixed on Christ
  | 'flow';      // Led by the Spirit

export type ConnectionType = 
  | 'flow'       // Spirit flows
  | 'presence'   // Christ in us
  | 'resonance'; // Unity in Him

export type ConsciousnessType = 
  | 'individual'  // Personal sanctification
  | 'collective'; // Body of Christ

export type SpaceType = 
  | 'thought'    // Mind of Christ
  | 'feeling'    // Heart after God
  | 'intuition'; // Spirit's leading

// Measure Validation - Ensuring proper bounds
export const isValidMeasure = (value: unknown): value is number => {
  if (typeof value !== 'number' || isNaN(value)) return false;
  return value >= 0 && value <= 1; // All measures submit to His bounds
};

// Type Guards - Protecting the sacred boundaries
export const isFlowType = (type: unknown): type is FlowType =>
  typeof type === 'string' && ['meditation', 'focus', 'flow'].includes(type);

export const isConnectionType = (type: unknown): type is ConnectionType =>
  typeof type === 'string' && ['flow', 'presence', 'resonance'].includes(type);

export const isConsciousnessType = (type: unknown): type is ConsciousnessType =>
  typeof type === 'string' && ['individual', 'collective'].includes(type);

export const isSpaceType = (type: unknown): type is SpaceType =>
