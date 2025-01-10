import {
  Presence,
  Harmony,
  Energy,
  Depth,
  FlowType,
  ConnectionType,
  ConsciousnessType,
  SpaceType,
  validateFlow
} from './order';

/**
 * Core Structural Types
 * 
 * These types define the fundamental structures of the system.
 * They are composed from the primitive types defined in order.ts.
 */

// Core Flow Structure
export interface NaturalFlow {
  presence: Presence;   // Current manifestation level
  harmony: Harmony;     // Current alignment level
  rhythm: number;       // Natural oscillation rate
  resonance: number;    // Harmonic amplification
  coherence: number;    // Internal consistency
}

// Energy Structure
export interface EnergyState {
  level: Energy;        // Current energy level
  quality: number;      // Energy refinement
  stability: number;    // Energy consistency
  protection: number;   // Energy boundary strength
}

// Connection Structure
export interface Connection {
  from: string;         // Source identifier
  to: string;          // Target identifier
  type: ConnectionType; // Nature of connection
  strength: number;     // Connection intensity
}

// Space Structure
export interface FlowSpace {
  id: string;          // Unique identifier
  type: FlowType;      // Space character
  flow: NaturalFlow;   // Current flow state
  depth: Depth;        // Space profundity
  connections: Connection[]; // Space relationships
}

// Field Structure
export interface Field {
  center: {
    x: number;
    y: number;
    z: number;
  };
  radius: number;      // Field extent
  strength: number;    // Field intensity
}

// Resonance Structure
export interface Resonance {
  frequency: number;   // Oscillation rate
  amplitude: number;   // Wave height
  harmony: Harmony;    // Wave coherence
  field: Field;       // Influence field
  divine: number;     // Transcendent quality
}

// Protection Structure
export interface Protection {
  level: number;      // Shield strength
  strength: number;   // Boundary force
  field: Field;      // Protection field
}

// Mind Structure
export interface MindSpace {
  id: string;         // Unique identifier
  type: SpaceType;    // Mental character
  resonance: Resonance; // Thought pattern
  depth: Depth;       // Mental depth
  connections: Connection[]; // Mental links
}

// System State
export interface ConsciousnessState {
  id: string;         // Unique identifier
  type: ConsciousnessType; // State character
  flow: NaturalFlow;  // Current flow
  energy: EnergyState; // Energy state
  depth: Depth;       // State depth
  spaces: FlowSpace[]; // Active spaces
  connections: Connection[]; // State connections
}

// Type Guards and Validation
export const isValidFlow = (flow: NaturalFlow): boolean =>
  validateFlow(flow);

export const isValidEnergyState = (state: EnergyState): boolean =>
  validateFlow(state);

export const isValidSpace = (space: FlowSpace): boolean =>
  isValidFlow(space.flow) && space.depth >= 0 && space.depth <= 1; 