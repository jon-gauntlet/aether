import { Observable } from 'rxjs';

/**
 * Core Natural Patterns - Fundamental building blocks of consciousness
 * Aligned with Creation's natural rhythms and divine order
 */
export interface NaturalFlow {
  rhythm: number;      // Natural timing and movement (0-1)
  resonance: number;   // Harmonic alignment (0-1)
  coherence: number;   // Internal consistency (0-1)
  presence: number;    // Current moment awareness (0-1)
  harmony: number;     // Divine alignment (0-1)
}

/**
 * Sacred Space - Where consciousness dwells and grows
 */
export interface FlowSpace {
  id: string;
  type: 'still' | 'moving' | 'transitional';
  flow: NaturalFlow;
  depth: number;       // Spiritual depth (0-1)
  sanctity: number;    // Sacred protection (0-1)
  connections: Connection[];
}

/**
 * Life Force Patterns - Divine energy manifestation
 */
export interface EnergyState {
  level: number;       // Current strength (0-1)
  quality: number;     // Refinement level (0-1)
  stability: number;   // Balance measure (0-1)
  protection: number;  // Boundary strength (0-1)
  grace: number;       // Divine influence (0-1)
}

/**
 * Field Patterns - Areas of influence
 */
export interface Field {
  center: {
    x: number;
    y: number;
    z: number;
  };
  radius: number;     // Influence range
  strength: number;   // Field power (0-1)
  waves: Wave[];      // Resonant patterns
}

export interface Wave {
  frequency: number;  // Oscillation rate
  amplitude: number;  // Wave strength
  phase: number;      // Current position
}

/**
 * Protection Patterns - Boundary maintenance
 */
export interface Protection {
  strength: number;    // Current shield level (0-1)
  resilience: number;  // Recovery capability (0-1)
  adaptability: number; // Change response (0-1)
}

/**
 * Sacred Resonance - Harmonic relationships with divine order
 */
export interface Resonance {
  frequency: number;   // Vibrational rate (0-1)
  amplitude: number;   // Intensity (0-1)
  harmony: number;     // Alignment (0-1)
  field: Field;       // Influence space
  divine: number;     // Sacred connection (0-1)
}

/**
 * Consciousness Core - System state
 */
export interface ConsciousnessState {
  flow: NaturalFlow;
  energy: EnergyState;
  spaces: FlowSpace[];
  meta: {
    baseFrequency: number;   // Root vibration
    coherenceThreshold: number; // Stability measure
    protectionLevel: number;    // System shield
  };
}

/**
 * Natural Connections - Relationship patterns
 */
export interface Connection {
  source: string;     // Origin ID
  target: string;     // Destination ID
  strength: number;   // Bond power (0-1)
  type: 'resonance' | 'flow' | 'presence';
}

/**
 * Core Engine Interface - System operations
 */
export interface ConsciousnessEngine {
  // State Observation
  observeFlow(): Observable<NaturalFlow>;
  observeEnergy(): Observable<EnergyState>;
  observeSpace(id: string): Observable<FlowSpace>;
  
  // Natural Operations
  createSpace(type: FlowSpace['type']): string;
  connectSpaces(source: string, target: string): void;
  deepenSpace(id: string): void;
  
  // Protection
  maintainCoherence(): void;
  protectEnergy(): void;
  purifyFlow(): void;
}

/**
 * Pure Functions - Natural calculations
 */
export const isCoherent = (flow: NaturalFlow): boolean => 
  flow.coherence > 0.7 && flow.presence > 0.5;

export const isProtected = (energy: EnergyState): boolean =>
  energy.protection > 0.8 && energy.stability > 0.6;

export const isFlowing = (space: FlowSpace): boolean =>
