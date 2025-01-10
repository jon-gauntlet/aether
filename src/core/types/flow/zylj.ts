import { Stream } from './experience/flow';

export interface NaturalFlow {
  rhythm: number;
  resonance: number;
  coherence: number;
  presence: number;
  harmony: number;
}

export interface State {
  streams: Stream[];
  spaces: Space[];
}

export interface Space {
  id: string;
  type: SpaceType;
  flow: NaturalFlow;
  depth: number;
  connections: Connection[];
}

export interface Connection {
  from: string;
  to: string;
  strength: number;
}

