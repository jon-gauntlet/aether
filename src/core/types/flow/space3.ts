export interface NaturalFlow {
  rhythm: number;      // Natural timing and movement (0-1)
  resonance: number;   // Harmonic alignment (0-1)
  coherence: number;   // Internal consistency (0-1)
  presence: number;    // Current moment awareness (0-1)
  harmony: number;     // Divine alignment (0-1)
}

export interface Space {
  id: string;
  type: SpaceType;
  flow: NaturalFlow;
  depth: number;
  connections: Connection[];
}

export type SpaceType = 'personal' | 'shared' | 'sacred';

export interface Connection {
  from: string;
  to: string;
  type: 'presence' | 'resonance' | 'flow';
  strength: number;
}

export interface Stream {
  id: string;
  type: StreamType;
  flow: NaturalFlow;
  depth: number;
  presenceType?: PresenceType;
  lastActivity?: number;
}

export type StreamType = 'conscious' | 'subconscious' | 'divine';

