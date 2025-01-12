/**
 * Energy-based information system
 * Instead of messages in channels, we have energy flowing through space
 */

export interface EnergyField {
  id: string;
  intensity: number;      // Current energy level
  velocity: Vector3D;     // Direction and speed of information flow
  gravity: number;        // How strongly it attracts attention
  wavelength: number;     // Type of energy (focus, communication, etc)
  charge: number;         // Positive or negative impact on flow
}

export interface InformationParticle {
  id: string;
  content: any;
  energy: number;
  momentum: Vector3D;
  spin: number;          // How actively it's being discussed
  lifetime: number;      // How long it remains relevant
  bonds: Bond[];         // Connections to other particles
}

export interface FlowField {
  particles: InformationParticle[];
  energyFields: EnergyField[];
  gradients: Map<string, number>;  // Energy gradients in space
  barriers: Barrier[];             // Flow protection boundaries
  attractors: Attractor[];         // Points of interest
}

export interface Attractor {
  id: string;
  position: Vector3D;
  strength: number;
  type: AttractorType;
  resonance: number[];  // What types of information it attracts
}

export interface Barrier {
  id: string;
  strength: number;
  permeability: number;  // What can pass through
  lifetime: number;      // How long it lasts
  shape: BoundingVolume;
}

export interface Bond {
  source: string;
  target: string;
  strength: number;
  type: BondType;
  energy: number;
}

export type AttractorType = 
  | 'focus'      // Deep work zones
  | 'discussion' // Active conversations
  | 'reference'  // Important information
  | 'temporal'   // Time-sensitive items
  | 'social';    // Casual interactions

export type BondType =
  | 'context'    // Related by context
  | 'temporal'   // Related in time
  | 'semantic'   // Related by meaning
  | 'social'     // Related by people
  | 'causal';    // Cause and effect

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface BoundingVolume {
  center: Vector3D;
  radius: number;
  shape: 'sphere' | 'cube' | 'cylinder';
} 