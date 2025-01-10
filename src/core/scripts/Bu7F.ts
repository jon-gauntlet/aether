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
  type: 'personal' | 'shared' | 'sacred';
  flow: NaturalFlow;
  depth: number;
  connections: Connection[];
}

// Connection types
export interface Connection {
  from: string;
  to: string;
  type: 'presence' | 'resonance' | 'flow' | 'discussion' | 'reference' | 'social' | 'updates';
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