// Core flow types
export interface NaturalFlow {
  presence: number;
  harmony: number;
  rhythm: number;
  resonance: number;
  coherence: number;
}

// Space types
export interface FlowSpace {
  id: string;
  type: 'meditation' | 'focus' | 'flow';
  flow: NaturalFlow;
  depth: number;
  connections: Connection[];
}

// Connection types
export interface Connection {
  from: string;
  to: string;
  type: 'flow' | 'presence' | 'resonance';
  strength: number;
}

// Workspace types
export interface Space {
  id: string;
  name: string;
  purpose: string;
  character: {
    energy: number;
    focus: number;
    mood: Mood;
  };
  connections: Connection[];
}

export type Mood = 'focused' | 'lively' | 'casual' | 'quiet';

// Re-export workspace types
export * from '../workspace/types';

// Export consciousness types
export interface ConsciousnessState {
  id: string;
  type: 'individual' | 'collective';
  flow: NaturalFlow;
  depth: number;
  connections: Connection[];
  energy: number;
  spaces: FlowSpace[];
}

export interface EnergyState {
  level: number;
  quality: number;
  stability: number;
  protection: number;
}

export interface Member {
  id: string;
  focus: {
    level: number;
    quality: number;
  };
}

export interface Room {
  id: string;
  calm: number;
  focus: number;
  paths: Connection[];
}

export interface Stage {
  level: number;
  quality: number;
}

export interface State {
  focus: Stage;
  flow: Stage;
} 