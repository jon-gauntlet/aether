/**
 * Core Type Order
 * 
 * This file establishes the fundamental type hierarchy and relationships.
 * All other type definitions must follow this order.
 */

// Foundational Types
export type Presence = number; // [0,1] - Degree of manifestation
export type Harmony = number;  // [0,1] - Degree of alignment
export type Energy = number;   // [0,1] - Degree of vitality
export type Depth = number;    // [0,1] - Degree of profundity

// Core Flow Types
export type FlowType = 'meditation' | 'focus' | 'flow';
export type ConnectionType = 'flow' | 'presence' | 'resonance';
export type ConsciousnessType = 'individual' | 'collective';
export type SpaceType = 'thought' | 'feeling' | 'intuition';

// Validation Functions
export const isValidMeasure = (value: number): boolean => 
  value >= 0 && value <= 1;

export const validateFlow = (flow: {[key: string]: number}): boolean =>
  Object.values(flow).every(isValidMeasure);

// Type Guards
export const isFlowType = (type: string): type is FlowType =>
  ['meditation', 'focus', 'flow'].includes(type);

export const isConnectionType = (type: string): type is ConnectionType =>
  ['flow', 'presence', 'resonance'].includes(type);

export const isConsciousnessType = (type: string): type is ConsciousnessType =>
  ['individual', 'collective'].includes(type);

export const isSpaceType = (type: string): type is SpaceType =>
  ['thought', 'feeling', 'intuition'].includes(type); 