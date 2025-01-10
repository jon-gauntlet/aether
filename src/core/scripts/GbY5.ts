import { Observable } from 'rxjs';

// Core Natural Patterns
export interface NaturalFlow {
  rhythm: number;      // Natural timing and movement
  resonance: number;   // Harmonic alignment
  coherence: number;   // Internal consistency
  presence: number;    // Current moment awareness
}

// Space and Movement
export interface FlowSpace {
  id: string;
  type: 'still' | 'moving' | 'transitional';
  flow: NaturalFlow;
  depth: number;
  connections: Connection[];
}

// Energy and Presence 
export interface EnergyState {
  level: number;
  quality: number;
  stability: number;
  protection: number;
}

// Field Patterns
export interface Field {
  center: {
    x: number;
    y: number;
    z: number;
  };
  radius: number;
  strength: number;
  waves: Wave[];
}

export interface Wave {
  frequency: number;
  amplitude: number;
  phase: number;
}

// Protection Patterns
export interface Protection {
  strength: number;    // Current protection level
  resilience: number;  // Recovery capability
  adaptability: number; // Change response
}

// Resonance Patterns
export interface Resonance {
  frequency: number;   // Vibrational rate
  amplitude: number;   // Intensity
  harmony: number;     // Alignment
  field: Field;       // Influence space
}

// Consciousness Core
export interface ConsciousnessState {
  flow: NaturalFlow;
  energy: EnergyState;
  spaces: FlowSpace[];
  meta: {
    baseFrequency: number;
    coherenceThreshold: number;
    protectionLevel: number;
  };
}

// Natural Connections
export interface Connection {
  source: string;
  target: string;
  strength: number;
  type: 'resonance' | 'flow' | 'presence';
}

// Core Engine Interface
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

// Pure Functions
export const isCoherent = (flow: NaturalFlow): boolean => 
  flow.coherence > 0.7 && flow.presence > 0.5;

export const isProtected = (energy: EnergyState): boolean =>
  energy.protection > 0.8 && energy.stability > 0.6;

export const isFlowing = (space: FlowSpace): boolean =>
  space.flow.rhythm > 0.5 && space.flow.resonance > 0.6; 