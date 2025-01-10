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
  type: 'presence' | 'resonance' | 'flow';
  strength: number;
}

// Re-export workspace types
export * from '../workspace/types'; 