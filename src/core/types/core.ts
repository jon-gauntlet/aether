// Core types that don't fit in other domains

export type Depth = 'surface' | 'shallow' | 'deep' | 'profound';

export interface Connection {
  from: string;
  to: string;
  type: 'flow' | 'presence' | 'resonance';
  strength: number;
}

export interface Space {
  id: string;
  type: string;
  depth: Depth;
  connections: Connection[];
} 