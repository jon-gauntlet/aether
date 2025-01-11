// Base types for the system

// Space
export interface Space {
  id?: string;
  type?: string;
}

// Connection
export interface Connection {
  id: string;
  from: string;
  to: string;
  strength: number;
}

// Energy
export interface EnergyState {
  mental: number;
  physical: number;
  emotional: number;
}

// Protection
export interface Protection {
  level: number;
  type: string;
  shields: number;
}

// Flow
export interface NaturalFlow {
  intensity: number;
  stability: number;
  coherence: number;
  energy: number;
}

// Resonance
export interface ResonanceWave {
  frequency: number;
  amplitude: number;
  phase: number;
}

export interface Resonance {
  primary: ResonanceWave;
  harmonics: ResonanceWave[];
  frequency: number;
  amplitude: number;
  phase: number;
  coherence: number;
  harmony: number;
}

// Field
export interface IField {
  id: string;
  center: {
    x: number;
    y: number;
    z: number;
  };
  radius: number;
  strength: number;
  coherence: number;
  stability: number;
  resonance: Resonance;
  protection: Protection;
  energy: EnergyState;
  waves: ResonanceWave[];
}
