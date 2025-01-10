/**
 * Core Type Order
 * 
 * This file establishes the foundational type hierarchy,
 * reflecting the divine order in our system.
 */

// Divine Measures - The foundational measures of reality
export type Presence = number;  // [0,1] - Degree of manifestation
export type Harmony = number;   // [0,1] - Degree of alignment with divine order
export type Energy = number;    // [0,1] - Degree of divine energy
export type Depth = number;     // [0,1] - Degree of spiritual depth

// Sacred Flow Types - The ways in which divine energy moves
export type FlowType = 
  | 'meditation'  // Deep communion
  | 'focus'       // Directed attention
  | 'flow';       // Natural movement

export type ConnectionType = 
  | 'flow'        // Natural connection
  | 'presence'    // Conscious connection
  | 'resonance';  // Harmonic connection

export type ConsciousnessType = 
  | 'individual'  // Personal consciousness
  | 'collective'; // Shared consciousness

export type SpaceType = 
  | 'thought'     // Mental space
  | 'feeling'     // Emotional space
  | 'intuition';  // Spiritual space

// Measure Validation - Ensuring proper bounds
export const isValidMeasure = (value: number): boolean => 
  typeof value === 'number' && value >= 0 && value <= 1;

// Type Guards - Protecting the sacred boundaries
export const isFlowType = (type: string): type is FlowType =>
  ['meditation', 'focus', 'flow'].includes(type);

export const isConnectionType = (type: string): type is ConnectionType =>
  ['flow', 'presence', 'resonance'].includes(type);

export const isConsciousnessType = (type: string): type is ConsciousnessType =>
  ['individual', 'collective'].includes(type);

export const isSpaceType = (type: string): type is SpaceType =>
