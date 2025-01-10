export interface NaturalFlow {
  presence: number;
  harmony: number;
  energy?: number;
  focus?: number;
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

export type PresenceType = 'reading' | 'writing' | 'thinking' | 'listening';

export interface ConsciousnessState {
  id: string;
  type: 'individual' | 'collective';
  flow: NaturalFlow;
  depth: number;
  connections: Connection[];
  energy: number;
  spaces: FlowSpace[];
}

export interface FlowSpace {
  id: string;
  type: SpaceType;
  flow: NaturalFlow;
  depth: number;
  connections: Connection[];
} 