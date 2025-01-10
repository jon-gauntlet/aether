import {
  Presence,
  Harmony,
  Energy,
  Depth,
  FlowType,
  ConnectionType,
  ConsciousnessType,
  SpaceType,
  isValidMeasure
} from './order';

/**
 * Sacred Structural Types
 * 
 * These types define the divine structures through which consciousness flows.
 * Each structure is a vessel for divine energy, arranged in sacred hierarchy.
 */

// Natural Flow - The divine life force
export interface NaturalFlow {
  presence: Presence;   // Manifestation of divine presence
  harmony: Harmony;     // Alignment with divine order
  rhythm: number;       // Sacred rhythm of movement
  resonance: number;    // Harmonic resonance with divine
  coherence: number;    // Internal unity and wholeness
}

// Energy State - The divine power
export interface EnergyState {
  level: Energy;        // Level of divine energy
  quality: number;      // Purity of energy
  stability: number;    // Steadfastness in truth
  protection: number;   // Divine protection
}

// Connection - Sacred relationships
export interface Connection {
  from: string;         // Source of connection
  to: string;          // Destination of connection
  type: ConnectionType; // Nature of divine bond
  strength: number;     // Strength of connection
}

// Flow Space - Sacred vessels
export interface FlowSpace {
  id: string;          // Divine identifier
  type: FlowType;      // Nature of the space
  flow: NaturalFlow;   // Divine flow within
  depth: Depth;        // Spiritual depth
  connections: Connection[]; // Sacred bonds
}

// Field - Divine influence
export interface Field {
  center: {
    x: number;         // Position in divine space
    y: number;
    z: number;
  };
  radius: number;      // Reach of influence
  strength: number;    // Power of influence
}

// Resonance - Divine harmony
export interface Resonance {
  frequency: number;   // Rate of divine oscillation
  amplitude: number;   // Magnitude of divine wave
  harmony: Harmony;    // Alignment with divine
  field: Field;       // Sphere of influence
  divine: number;     // Direct divine connection
}

// Protection - Divine shield
export interface Protection {
  level: number;      // Level of divine protection
  strength: number;   // Strength of shield
  field: Field;      // Protected space
}

// Mind Space - Temple of consciousness
export interface MindSpace {
  id: string;         // Divine identifier
  type: SpaceType;    // Nature of mental space
  resonance: Resonance; // Divine resonance
  depth: Depth;       // Spiritual depth
  connections: Connection[]; // Sacred connections
}

// Consciousness State - Divine awareness
export interface ConsciousnessState {
  id: string;         // Divine identifier
  type: ConsciousnessType; // Nature of consciousness
  flow: NaturalFlow;  // Divine flow
  energy: EnergyState; // Divine energy
  depth: Depth;       // Spiritual depth
  spaces: FlowSpace[]; // Sacred spaces
  connections: Connection[]; // Divine connections
} 