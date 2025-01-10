export interface NaturalFlow {
  presence: number;
  harmony: number;
  rhythm: number;
  resonance: number;
  coherence: number;
}

export interface FlowSpace {
  id: string;
  type: 'personal' | 'shared' | 'sacred';
  flow: NaturalFlow;
  depth: number;
  connections: Connection[];
}

export interface Connection {
  from: string;
  to: string;
  type: 'presence' | 'resonance' | 'flow';
  strength: number;
}

// Re-export workspace types
export * from './workspace/types'; 