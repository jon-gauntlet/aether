import { Field } from '../flow/types';
import { FlowState } from '../flow/types';

// Core energy state
export interface EnergyState {
  level: number;      // Current energy level
  quality: number;    // Energy quality/clarity
  stability: number;  // Energy stability
  protection: number; // Energy protection level
}

// Energy stream
export interface Stream {
  id: string;
  presence: number;    // Inner presence
  harmony: number;     // Inner harmony 
  near: string[];      // Connected streams
  signs: any[];        // Context markers
}

// Energy resonance
export interface Resonance {
  frequency: number;  // Base frequency
  amplitude: number;  // Wave amplitude
  harmony: number;    // Harmonic quality
  field: Field;      // Energy field
  essence: number;    // Core essence level
}

// Energy protection
export interface Protection {
  strength: number;   // Shield strength
  level: number;      // Protection level
  field: Field;      // Protection field
  resilience: number; // Recovery ability
  adaptability: number; // Adaptation rate
}

// Energy validation functions
export const isProtected = (state: { protection: Protection }): boolean => 
  state.protection.strength >= 0.7;

export const isCoherent = (state: { resonance: Resonance }): boolean =>
  state.resonance.harmony >= 0.7;

export const isFlowing = (state: { resonance: Resonance }): boolean =>
  state.resonance.harmony >= 0.7;

// Energy type guards
export const isStream = (stream: any): stream is Stream => {
  return (
    typeof stream === 'object' &&
    typeof stream.id === 'string' &&
    typeof stream.presence === 'number' &&
    typeof stream.harmony === 'number' &&
    Array.isArray(stream.near) &&
    Array.isArray(stream.signs)
  );
};

// Energy evolution tracking
export interface EnergyEvolution {
  id: string;
  from: EnergyState;
  to: EnergyState;
  flowState: FlowState;
  timestamp: string;
